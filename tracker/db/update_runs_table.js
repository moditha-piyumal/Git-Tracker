const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "../data/gittracker.db");
const db = new Database(dbPath);

try {
	db.exec(`
	ALTER TABLE runs ADD COLUMN started_at TEXT DEFAULT (datetime('now', 'localtime'));
	ALTER TABLE runs ADD COLUMN finished_at TEXT DEFAULT (datetime('now', 'localtime'));
	`);
	console.log("✅ Added started_at and finished_at columns to runs table.");
} catch (err) {
	console.error("⚠️ Update skipped (columns may already exist):", err.message);
}
