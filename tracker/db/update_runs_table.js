// tracker/db/update_runs_table.js
const Database = require("better-sqlite3");
const path = require("path");

// Path to the database
const dbPath = path.join(__dirname, "..", "data", "gittracker.db");

let db;
try {
	// 🧠 1️⃣ Open the database
	db = new Database(dbPath);

	// ⚙️ 2️⃣ Run the ALTER TABLE commands
	db.exec(`
    ALTER TABLE runs ADD COLUMN started_at TEXT DEFAULT (datetime('now', 'localtime'));
    ALTER TABLE runs ADD COLUMN finished_at TEXT DEFAULT (datetime('now', 'localtime'));
  `);

	console.log("✅ Added started_at and finished_at columns to runs table.");
} catch (err) {
	// ⚠️ 3️⃣ Handle errors gracefully
	console.error("⚠️ Update skipped (columns may already exist):", err.message);
} finally {
	// 🧹 4️⃣ Always close the database connection
	if (db) {
		db.close();
		console.log("✅ Database connection closed.");
	}
}
