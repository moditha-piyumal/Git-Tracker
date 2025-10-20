// STEP 5 - PART 2: Verification Logic
const path = require("path");
const Database = require("better-sqlite3");
const { spawn } = require("child_process");
const { app, BrowserWindow, ipcMain } = require("electron");

// --- Database location ---
const dbPath = path.join(__dirname, "data", "gittracker.db");

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
