// tracker/db/migrate.js
const db = require("./index");

function runMigrations() {
	try {
		console.log("🧩 Running database migrations...");

		const schema = `
    -- repos: each tracked repository
    CREATE TABLE IF NOT EXISTS repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,          -- absolute path on disk
      name TEXT NOT NULL,                 -- display name
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- runs: every time the tracker (or verifier) runs
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_ts TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      started_at TEXT DEFAULT (datetime('now','localtime')),
      finished_at TEXT DEFAULT (datetime('now','localtime')),
      status TEXT NOT NULL CHECK(status IN ('success','failed')),
      error_message TEXT,
      duration_ms INTEGER,
      scanned_repos INTEGER,
      version TEXT
    );

    -- per-repo, per-day numbers (for repo contributions/pie later)
    CREATE TABLE IF NOT EXISTS daily_repo_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id INTEGER NOT NULL,
      date_yyyy_mm_dd TEXT NOT NULL,      -- e.g., "2025-10-19"
      insertions INTEGER NOT NULL DEFAULT 0,
      deletions INTEGER NOT NULL DEFAULT 0,
      edits INTEGER NOT NULL DEFAULT 0,   -- insertions + deletions
      commits INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
      UNIQUE (repo_id, date_yyyy_mm_dd)
    );

    -- daily totals across all repos (for charts)
    CREATE TABLE IF NOT EXISTS daily_totals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_yyyy_mm_dd TEXT NOT NULL UNIQUE,
      insertions INTEGER NOT NULL DEFAULT 0,
      deletions INTEGER NOT NULL DEFAULT 0,
      edits INTEGER NOT NULL DEFAULT 0,
      commits INTEGER NOT NULL DEFAULT 0
    );

    -- app settings (timezone, roots, ignore patterns, etc.)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- helpful indexes
    CREATE INDEX IF NOT EXISTS idx_daily_repo_stats_date
      ON daily_repo_stats(date_yyyy_mm_dd);

    CREATE INDEX IF NOT EXISTS idx_daily_repo_stats_repo
      ON daily_repo_stats(repo_id);
    `;

		db.exec(schema);
		console.log("✅ Database ready: tables ensured.");

		// ------------------------------------------------------------------
		// 🔧 Safe column upgrade checks (in case of schema evolution)
		// ------------------------------------------------------------------
		const cols = db.prepare("PRAGMA table_info(runs);").all();

		const addColumnIfMissing = (name, sql) => {
			if (!cols.find((c) => c.name === name)) {
				console.log(`🛠 Adding missing column '${name}' to runs table...`);
				db.prepare(sql).run();
			}
		};

		addColumnIfMissing(
			"started_at",
			"ALTER TABLE runs ADD COLUMN started_at TEXT;"
		);
		addColumnIfMissing(
			"finished_at",
			"ALTER TABLE runs ADD COLUMN finished_at TEXT;"
		);

		console.log("✅ Migration check complete. All tables and columns ready.");
	} catch (err) {
		console.error("❌ Migration failed:", err.message);
	}
}

module.exports = { runMigrations };
