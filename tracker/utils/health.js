// tracker/utils/health.js
const fs = require("fs");
const path = require("path");
// const Database = require("better-sqlite3");
// Use Electron-compatible build when running inside Electron
const isElectron = !!process.versions.electron;
const Database = isElectron
	? require("../../electron_modules/node_modules/better-sqlite3")
	: require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "data", "gittracker.db");

// 1️⃣ Check DB file presence and writability
function dbExistsAndWritable() {
	try {
		if (!fs.existsSync(dbPath)) {
			return { ok: false, reason: "not_found" };
		}
		fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
		return { ok: true };
	} catch (err) {
		return { ok: false, reason: "unreadable", error: err };
	}
}

// 2️⃣ Check recent successful run in `runs` table
function recentSuccess(hours = 36) {
	try {
		if (!fs.existsSync(dbPath)) {
			return { ok: false, reason: "not_found" };
		}

		const db = new Database(dbPath, { readonly: true });
		const stmt = db.prepare(
			"SELECT finished_at FROM runs WHERE status='success' ORDER BY finished_at DESC LIMIT 1"
		);
		const row = stmt.get();

		if (!row) {
			return { ok: false, reason: "no_runs" };
		}

		const lastRun = new Date(row.finished_at.replace(" ", "T"));

		const ageHrs = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);

		if (ageHrs > hours) {
			return { ok: false, reason: "stale", lastSuccess: lastRun };
		}

		return { ok: true, lastRun };
	} catch (err) {
		return { ok: false, reason: "query_failed", error: err };
	}
}

module.exports = { dbExistsAndWritable, recentSuccess };
