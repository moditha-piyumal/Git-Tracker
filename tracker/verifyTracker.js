// STEP 5 - PART 2: Verification Logic
const path = require("path");
const Database = require("better-sqlite3");
const { spawn } = require("child_process");
const { app, BrowserWindow, ipcMain } = require("electron");

// =============================================
// Step 7.1 — Backend Query Layer for Verifier
// =============================================

// Path to the main database file
const dbPath = path.join(__dirname, "data", "gittracker.db");

// Fetch the most recent runs from the database
function getRecentRuns(limit = 5) {
	try {
		const db = new Database(dbPath, { readonly: true });
		const rows = db
			.prepare(
				`SELECT finished_at, status, duration_ms, scanned_repos, error_message
				 FROM runs
				 ORDER BY finished_at DESC
				 LIMIT ?`
			)
			.all(limit);
		db.close();
		return rows;
	} catch (err) {
		console.error("❌ Failed to read runs table:", err.message);
		return [];
	}
}

// =============================================
// Step 7.2 — Health Evaluation for Verifier
// =============================================

// Decide current health based on recent runs
function evaluateHealth(runs) {
	if (!runs || runs.length === 0) {
		return {
			color: "red",
			message: "No tracker runs recorded yet.",
		};
	}

	const latest = runs[0];
	const lastTime = new Date(latest.finished_at);
	const hoursAgo = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);

	if (latest.status === "failed") {
		return {
			color: "red",
			message: `❌ Last run FAILED (${
				latest.error_message || "unknown error"
			})`,
		};
	}

	if (hoursAgo > 36) {
		return {
			color: "yellow",
			message: `⚠️ No successful run in the past ${Math.floor(
				hoursAgo
			)} hours.`,
		};
	}

	return {
		color: "green",
		message: `🟢 Last run successful — ${latest.scanned_repos} repos, ${
			latest.duration_ms
		} ms ago (${Math.round(hoursAgo)} h).`,
		recent: runs,
	};
}

// Temporary test (you can comment this out later)
if (require.main === module) {
	console.log("🧾 Recent runs from database:");
	const runs = getRecentRuns(5);
	console.log(runs.length ? runs : "No runs found.");

	// 👉 New Step 7.2 test
	const health = evaluateHealth(runs);
	console.log("\nHealth summary:");
	console.log(health);

	process.exit(0);
}

// --- Database location ---
// const dbPath = path.join(__dirname, "data", "gittracker.db");

// --- Helper: check if today's data exists ---
function checkTodayRecord() {
	const db = new Database(dbPath);
	const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
	const stmt = db.prepare(
		"SELECT COUNT(*) AS count FROM daily_totals WHERE date_yyyy_mm_dd = ?"
	);
	const result = stmt.get(today);
	db.close();
	return result.count > 0; // true = success
}

// --- Electron window factory ---
function createWindow(mode) {
	const win = new BrowserWindow({
		width: 420,
		height: 250,
		resizable: false,
		title: "Git-Tracker Verification",
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	win.loadFile(path.join(__dirname, "ui", "verifyWindow.html"));

	// send mode to renderer once it’s ready
	win.webContents.once("did-finish-load", () => {
		win.webContents.send("verification-mode", mode);
	});
}

// --- IPC listener for retry ---
ipcMain.on("retry-tracker", () => {
	const trackerPath = path.join(__dirname, "coreTracker.js");
	spawn("node", [trackerPath], {
		cwd: __dirname,
		detached: true,
		stdio: "ignore",
	}).unref();
	app.quit();
});

// --- Main logic ---
app.whenReady().then(() => {
	const hasToday = checkTodayRecord();
	const mode = hasToday ? "success" : "fail";
	createWindow(mode);
});

app.on("window-all-closed", () => {
	app.quit();
});
