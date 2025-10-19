// tracker/coreTracker.js
const db = require("./db/index");
const { execSync } = require("child_process");
const path = require("path");

function getActiveRepos() {
	const stmt = db.prepare(
		"SELECT id, path, name FROM repos WHERE is_active = 1"
	);
	return stmt.all(); // returns an array of repo objects
}

function getTodayStats(repoPath) {
	try {
		// Midnight in local time (Asia/Colombo)
		const now = new Date();
		const startOfDay = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate()
		);
		const since = startOfDay.toISOString();

		// Run git log to get today's changes
		const output = execSync(
			`git log --since="${since}" --numstat --no-merges`,
			{
				cwd: repoPath,
				encoding: "utf8",
			}
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
		// If repo has no commits today or git fails
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

// ===========================
// STEP 3 - PART 7: MAIN RUN
// ===========================
function runTrackerForToday() {
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

	// 6) Friendly summary
	console.log(
		`\n🔥 Total for ${today}: +${totalAdded} / -${totalRemoved} (${totalEdits} edits, ${totalCommits} commits)`
	);
}

// Run it now (you can comment this out later and call it from scheduler)
runTrackerForToday();
