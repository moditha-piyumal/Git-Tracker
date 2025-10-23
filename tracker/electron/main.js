// tracker/electron/main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

// ✅ Use Electron’s local build of better-sqlite3
const Database = require("../../electron_modules/node_modules/better-sqlite3");
const dbPath = path.join(__dirname, "..", "data", "gittracker.db");

// Compute a simple moving average over an array of numbers.
// windowSize=7 → 7-day MA; windowSize=30 → 30-day MA
function movingAverage(values, windowSize) {
	const out = [];
	for (let i = 0; i < values.length; i++) {
		const start = Math.max(0, i - windowSize + 1);
		const window = values.slice(start, i + 1);
		const sum = window.reduce((a, b) => a + b, 0);
		out.push(sum / window.length);
	}
	return out;
}

function createWindow() {
	const win = new BrowserWindow({
		width: 1000,
		height: 800,
		backgroundColor: "#1e1e1e",
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
		title: "Git-Tracker v2 Dashboard",
	});

	win.loadFile(path.join(__dirname, "dashboard.html"));
}

// ----------------------------------------------------
// 🧠 IPC: Fetch dashboard data
// ----------------------------------------------------
ipcMain.handle("get-dashboard-data", () => {
	try {
		const db = new Database(dbPath, { readonly: true });

		// Last run info
		const lastRun = db
			.prepare(
				`SELECT finished_at, status, scanned_repos, duration_ms
         FROM runs ORDER BY finished_at DESC LIMIT 1`
			)
			.get();

		// Total days recorded
		const totalDays = db
			.prepare(`SELECT COUNT(*) AS c FROM daily_totals`)
			.get().c;

		db.close();

		if (!lastRun) return { ok: false, message: "No runs yet." };

		return {
			ok: true,
			message: `Last Run (${lastRun.status.toUpperCase()}) — ${
				lastRun.scanned_repos
			} repos, ${lastRun.duration_ms} ms`,
			totalDays,
		};
	} catch (err) {
		return { ok: false, message: `DB Error: ${err.message}` };
	}
});

// ----------------------------------------------------
// 🧠 IPC: Get data for the Daily Edits chart
// Returns last N days (default 120) sorted ASC, with 7/30-day MAs on 'edits'
// ----------------------------------------------------
ipcMain.handle("get-daily-edits", (event, { days = 120 } = {}) => {
	try {
		const db = new Database(dbPath, { readonly: true });

		// 1) Pull last N days, newest first
		const rowsDesc = db
			.prepare(
				`
      SELECT date_yyyy_mm_dd AS date, insertions AS added, deletions AS removed, edits, commits
      FROM daily_totals
      ORDER BY date_yyyy_mm_dd DESC
      LIMIT ?
    `
			)
			.all(days);

		db.close();

		// 2) We want oldest → newest for proper charting & moving averages
		const rows = rowsDesc.reverse();

		// 3) Extract arrays for Chart.js
		const labels = rows.map((r) => r.date);
		const added = rows.map((r) => r.added || 0);
		const removed = rows.map((r) => r.removed || 0);
		const edits = rows.map((r) => r.edits || 0);

		// 4) Compute moving averages for 'edits' only
		const ma7 = movingAverage(edits, 7);
		const ma30 = movingAverage(edits, 30);

		return {
			ok: true,
			labels,
			added,
			removed,
			edits,
			ma7,
			ma30,
		};
	} catch (err) {
		return { ok: false, message: `DB Error: ${err.message}` };
	}
});

// ----------------------------------------------------
// 🧠 IPC: Get commits per day (last 30 days)
// ----------------------------------------------------
ipcMain.handle("get-commits-chart", (event, { days = 30 } = {}) => {
	try {
		const db = new Database(dbPath, { readonly: true });

		// 1️⃣  Get the last N days of commits
		const rowsDesc = db
			.prepare(
				`
      SELECT date_yyyy_mm_dd AS date, commits
      FROM daily_totals
      ORDER BY date_yyyy_mm_dd DESC
      LIMIT ?
    `
			)
			.all(days);

		db.close();

		// 2️⃣  Reverse to show oldest → newest
		const rows = rowsDesc.reverse();

		// 3️⃣  Split into arrays for Chart.js
		const labels = rows.map((r) => r.date);
		const commits = rows.map((r) => r.commits || 0);

		return { ok: true, labels, commits };
	} catch (err) {
		return { ok: false, message: `DB Error: ${err.message}` };
	}
});

// ----------------------------------------------------
// 🧠 IPC: Manual “Run Tracker Now” button
// ----------------------------------------------------
ipcMain.handle("run-tracker-now", () => {
	const trackerPath = path.join(__dirname, "..", "coreTracker.js");
	spawn("node", [trackerPath], {
		cwd: path.join(__dirname, ".."),
		detached: true,
		stdio: "ignore",
	}).unref();
	return { started: true };
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
