// tracker/coreTracker.js
const db = require("./db/index");
const { execSync } = require("child_process");
const path = require("path");
// Step 6.2 – Lifecycle utilities
const log = require("./utils/logger");
const { acquireLock, releaseLock } = require("./utils/lock");
const { dbExistsAndWritable, recentSuccess } = require("./utils/health");

// 🧩 Ensure database schema exists
try {
	const { runMigrations } = require("./db/migrate");
	runMigrations();
	console.log("✅ Database checked and up-to-date.");
} catch (err) {
	console.error("❌ Migration failed:", err.message);
}

// STEP 0: Run the repo scanner automatically before tracking
try {
	console.log("🔁 Running repository scanner before tracking...");
	require("./repoScanner");
	console.log("✅ Repository scanner completed.\n");
} catch (err) {
	console.error("❌ Repo scanner failed:", err.message);
}

function getActiveRepos() {
	const stmt = db.prepare(
		"SELECT id, path, name FROM repos WHERE is_active = 1"
	);
	return stmt.all(); // returns an array of repo objects
}

function getTodayStats(repoPath) {
	try {
		const now = new Date(); // 🟢 add this line

		// Midnight in local time (Asia/Colombo)
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, "0");
		const d = String(now.getDate()).padStart(2, "0");
		const since = `${y}-${m}-${d} 00:00:00`;

		const output = execSync(
			`git log --since="${since}" --numstat --no-merges -M`,
			{ cwd: repoPath, encoding: "utf8" }
		);

		let added = 0,
			removed = 0,
			commits = 0;

		const lines = output.split("\n");
		for (const line of lines) {
			if (line.trim() === "") continue;

			const parts = line.split("\t");
			if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
				added += parseInt(parts[0]);
				removed += parseInt(parts[1]);
			} else if (line.startsWith("commit")) {
				commits++;
			}
		}

		return { added, removed, edits: added + removed, commits };
	} catch {
		return { added: 0, removed: 0, edits: 0, commits: 0 };
	}
}

// STEP 3 - PART 5
function saveDailyStats(repoId, date, stats) {
	const insertRepo = db.prepare(`
    INSERT INTO daily_repo_stats (repo_id, date_yyyy_mm_dd, insertions, deletions, edits, commits)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(repo_id, date_yyyy_mm_dd) DO UPDATE SET
      insertions = excluded.insertions,
      deletions  = excluded.deletions,
      edits      = excluded.edits,
      commits    = excluded.commits;
  `);

	insertRepo.run(
		repoId,
		date,
		stats.added,
		stats.removed,
		stats.edits,
		stats.commits
	);
}

// STEP 3 - PART 6
function saveDailyTotals(date, totals) {
	const insertTotal = db.prepare(`
    INSERT INTO daily_totals (date_yyyy_mm_dd, insertions, deletions, edits, commits)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(date_yyyy_mm_dd) DO UPDATE SET
      insertions = excluded.insertions,
      deletions  = excluded.deletions,
      edits      = excluded.edits,
      commits    = excluded.commits;
  `);

	insertTotal.run(
		date,
		totals.added,
		totals.removed,
		totals.edits,
		totals.commits
	);
}

// Step 6.2 – Record run summary in 'runs' table
function insertRun(
	db,
	status,
	scanned_repos,
	duration_ms,
	error_message = null
) {
	try {
		const stmt = db.prepare(`
      INSERT INTO runs (started_at, finished_at, status, duration_ms, scanned_repos, error_message)
      VALUES (datetime('now', 'localtime'), datetime('now', 'localtime'), ?, ?, ?, ?)
    `);
		stmt.run(status, duration_ms, scanned_repos, error_message);
	} catch (err) {
		log.error("Failed to insert run record: " + err.message);
	}
}
// 🧩 Helper: Fill ANY skipped days in daily_totals with 0 edits
function fillMissingDays() {
	// 1) Get *all* recorded dates, oldest → newest
	const rows = db
		.prepare(
			"SELECT date_yyyy_mm_dd FROM daily_totals ORDER BY date_yyyy_mm_dd ASC"
		)
		.all();

	if (!rows.length) return; // nothing yet, first ever run

	// 2) Build a Set for quick lookup of existing dates
	const existing = new Set(rows.map((r) => r.date_yyyy_mm_dd));

	// 3) Figure out the range we care about: first date → today
	const firstDateIso = rows[0].date_yyyy_mm_dd; // e.g. "2025-10-17"
	const todayIso = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"

	function isoToDate(iso) {
		const [y, m, d] = iso.split("-").map(Number);
		return new Date(y, m - 1, d);
	}

	let cursor = isoToDate(firstDateIso);

	const insertTotal = db.prepare(`
		INSERT OR IGNORE INTO daily_totals
			(date_yyyy_mm_dd, insertions, deletions, edits, commits)
		VALUES (?, 0, 0, 0, 0)
	`);

	// 4) Walk from first date up to *today*, filling any gaps
	while (cursor.toLocaleDateString("en-CA") <= todayIso) {
		const iso = cursor.toLocaleDateString("en-CA");

		if (!existing.has(iso)) {
			console.log("📅 Backfilling missing day with 0 edits:", iso);
			insertTotal.run(iso);
		}

		cursor.setDate(cursor.getDate() + 1);
	}
}

// ===========================
// STEP 3 - PART 7: MAIN RUN
// ===========================
function runTrackerForToday() {
	// Step 6.2 — Lifecycle: start, lock, and pre-flight checks
	const start = Date.now();
	log.section("Tracker Run Started");

	// 1️⃣ Acquire lock
	const lock = acquireLock();
	if (!lock.ok) {
		log.error("Another tracker instance is active. Exiting.");
		process.exit(1);
	}

	// 2️⃣ Database check
	const dbCheck = dbExistsAndWritable();
	if (!dbCheck.ok) {
		log.error("Database not found or not writable.");
		releaseLock();
		process.exit(1);
	}
	//-----------------

	// 🧩 Fill skipped days before scanning
	fillMissingDays();

	//-------------------------
	// 3️⃣ Health freshness check (non-blocking)
	const freshness = recentSuccess();
	if (!freshness.ok) {
		log.warn("No successful tracker run detected in the past 36 hours.");
	}

	let scanned_repos = 0; // we'll count as we go

	try {
		// 1) Get all repos we should scan
		const repos = getActiveRepos();

		// 2) Determine today's date in YYYY-MM-DD (local)
		const today = new Date().toLocaleDateString("en-CA"); // e.g., 2025-10-22

		// 3) Running totals across ALL repos for today
		let totalAdded = 0;
		let totalRemoved = 0;
		let totalEdits = 0;
		let totalCommits = 0;

		// 4) Scan each repo and accumulate
		for (const repo of repos) {
			scanned_repos++;
			console.log(`📊 Scanning ${repo.name}...`);
			const stats = getTodayStats(repo.path); // { added, removed, edits, commits }

			// save per-repo row (idempotent via ON CONFLICT in saveDailyStats)
			saveDailyStats(repo.id, today, stats);

			// add to the grand totals
			totalAdded += stats.added;
			totalRemoved += stats.removed;
			totalEdits += stats.edits;
			totalCommits += stats.commits;
		}

		// 5) Save the grand totals (idempotent via ON CONFLICT in saveDailyTotals)
		saveDailyTotals(today, {
			added: totalAdded,
			removed: totalRemoved,
			edits: totalEdits,
			commits: totalCommits,
		});

		// Step 6.2 — Wrap-up and run record
		const duration = Date.now() - start;
		insertRun(db, "success", repos.length, duration);
		log.info(`✅ Tracker run completed in ${duration} ms`);

		// releaseLock();
		// log.section("Tracker Run Ended");

		// 6) Friendly summary
		console.log(
			`\n🔥 Total for ${today}: +${totalAdded} / -${totalRemoved} (${totalEdits} edits, ${totalCommits} commits)`
		);
	} catch (err) {
		// If anything in the run failed, record a failed run and the error
		const duration = Date.now() - start;
		try {
			insertRun(db, "failed", 0, duration, err?.message || String(err));
		} catch (e2) {
			// best effort; don’t rethrow
		}
		log.error("❌ Tracker failed: " + (err?.message || String(err)));
	} finally {
		// Always release the lock and mark end in the log
		try {
			releaseLock();
		} catch {}
		log.section("Tracker Run Ended");
	}
}

// Run it now (you can comment this out later and call it from scheduler)
runTrackerForToday();
console.log("✅ Tracker finished successfully.");
process.exit(0);
