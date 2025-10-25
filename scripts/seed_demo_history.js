/**
 * Seed a demo SQLite DB with N days of fake history, without touching your real DB.
 * Usage examples:
 *   node scripts/seed_demo_history.js --days 700 --to ./data/demo_history.db --repos Ox,Cow,Bull,Hen
 *   node scripts/seed_demo_history.js --days 365 --from ./data/tracker.db --to ./data/demo_history.db
 *
 * Notes:
 * - If --from is provided, the script copies that DB first (schema + tables) to --to.
 * - If --from is omitted, it creates a fresh DB with the minimal tables needed.
 * - It NEVER overwrites an existing --to unless you pass --overwrite.
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const args = require("minimist")(process.argv.slice(2), {
	string: ["from", "to", "repos"],
	boolean: ["overwrite"],
	default: { days: 700, to: "./data/demo_history.db", overwrite: false },
});

const DAYS = Math.max(1, parseInt(args.days, 10) || 700);
const TO = path.resolve(args.to);
const FROM = args.from ? path.resolve(args.from) : null;
const REPOS = (args.repos || "Ox,Cow,Bull")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

if (fs.existsSync(TO) && !args.overwrite) {
	console.error(
		`[ABORT] Target DB already exists: ${TO}\nPass --overwrite to replace it.`
	);
	process.exit(1);
}

// Ensure target dir exists
fs.mkdirSync(path.dirname(TO), { recursive: true });

// Copy schema if --from is given, else start new
if (FROM) {
	if (!fs.existsSync(FROM)) {
		console.error(`[ABORT] --from path not found: ${FROM}`);
		process.exit(1);
	}
	fs.copyFileSync(FROM, TO);
	console.log(`[OK] Copied schema from ${FROM} -> ${TO}`);
} else {
	// Create empty file
	if (fs.existsSync(TO)) fs.unlinkSync(TO);
	fs.writeFileSync(TO, "");
	console.log(`[OK] Created new DB: ${TO}`);
}

const db = new Database(TO);

// If fresh DB, create the minimal tables we need.
db.exec(`
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS repos (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_totals (
  date_yyyy_mm_dd TEXT PRIMARY KEY,
  insertions INTEGER NOT NULL DEFAULT 0,
  deletions INTEGER NOT NULL DEFAULT 0,
  edits INTEGER NOT NULL DEFAULT 0,
  commits INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daily_repo_stats (
  repo_id INTEGER NOT NULL,
  date_yyyy_mm_dd TEXT NOT NULL,
  insertions INTEGER NOT NULL DEFAULT 0,
  deletions INTEGER NOT NULL DEFAULT 0,
  edits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (repo_id, date_yyyy_mm_dd),
  FOREIGN KEY (repo_id) REFERENCES repos(id)
);
`);

// Ensure repos exist (either read existing or insert provided names)
const getRepoByName = db.prepare(`SELECT id FROM repos WHERE name = ?`);
const insertRepo = db.prepare(`INSERT OR IGNORE INTO repos (name) VALUES (?)`);
REPOS.forEach((name) => insertRepo.run(name));
const allRepos = db
	.prepare(`SELECT id, name FROM repos ORDER BY name ASC`)
	.all();
if (allRepos.length === 0) {
	console.error("[ABORT] No repos available to seed.");
	process.exit(1);
}

// Helpers
function toYMD(d) {
	// YYYY-MM-DD
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}
function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle(arr) {
	return arr
		.map((v) => [Math.random(), v])
		.sort((a, b) => a[0] - b[0])
		.map((x) => x[1]);
}

// Prepared statements
const upsertDailyTotals = db.prepare(`
INSERT INTO daily_totals (date_yyyy_mm_dd, insertions, deletions, edits, commits)
VALUES (@date, @ins, @del, @edits, @commits)
ON CONFLICT(date_yyyy_mm_dd) DO UPDATE SET
  insertions = excluded.insertions,
  deletions  = excluded.deletions,
  edits      = excluded.edits,
  commits    = excluded.commits;
`);

const upsertDailyRepo = db.prepare(`
INSERT INTO daily_repo_stats (repo_id, date_yyyy_mm_dd, insertions, deletions, edits)
VALUES (@repo_id, @date, @ins, @del, @edits)
ON CONFLICT(repo_id, date_yyyy_mm_dd) DO UPDATE SET
  insertions = excluded.insertions,
  deletions  = excluded.deletions,
  edits      = excluded.edits;
`);

const txn = db.transaction((rows) => {
	rows.forEach((r) => upsertDailyTotals.run(r));
});

const txnRepo = db.transaction((rows) => {
	rows.forEach((r) => upsertDailyRepo.run(r));
});

// Generate DAYS of data ending today (inclusive)
const today = new Date();
const allDays = [];
for (let i = DAYS - 1; i >= 0; i--) {
	const d = new Date(today);
	d.setDate(today.getDate() - i);
	allDays.push(toYMD(d));
}

// Seed
let totalInserted = 0;
for (const date of allDays) {
	// Randomize “activity level” per day so the series looks realistic
	const isBigDay = Math.random() < 0.08;
	const isQuietDay = Math.random() < 0.2;

	const baseAdds = isBigDay
		? randInt(300, 900)
		: isQuietDay
		? randInt(0, 40)
		: randInt(60, 220);
	const baseDels = isBigDay
		? randInt(120, 420)
		: isQuietDay
		? randInt(0, 20)
		: randInt(20, 120);
	const commits = isBigDay
		? randInt(6, 18)
		: isQuietDay
		? randInt(0, 2)
		: randInt(2, 8);

	const dayTotals = {
		date,
		ins: baseAdds,
		del: baseDels,
		edits: baseAdds + baseDels,
		commits,
	};

	txn([dayTotals]); // upsert daily_totals

	// Per-repo splits: use 2–4 random repos, split totals
	const reposForDay = shuffle(allRepos).slice(
		0,
		randInt(2, Math.min(4, allRepos.length))
	);
	let remainingIns = baseAdds;
	let remainingDel = baseDels;

	const perRepoRows = [];
	reposForDay.forEach((repo, idx) => {
		const isLast = idx === reposForDay.length - 1;
		const shareFactor = isLast
			? 1
			: Math.random() * (1 / (reposForDay.length - idx)) + 0.1;
		const ins = isLast
			? remainingIns
			: Math.max(0, Math.round(remainingIns * shareFactor));
		const del = isLast
			? remainingDel
			: Math.max(0, Math.round(remainingDel * shareFactor));
		remainingIns -= ins;
		remainingDel -= del;

		perRepoRows.push({
			repo_id: repo.id,
			date,
			ins,
			del,
			edits: ins + del,
		});
	});

	if (perRepoRows.length > 0) txnRepo(perRepoRows);

	totalInserted++;
}

db.close();
console.log(`[DONE] Seeded ${DAYS} days into: ${TO}`);
console.log(`[INFO] Repos used: ${allRepos.map((r) => r.name).join(", ")}`);
