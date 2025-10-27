/* -------------------------------------------------------------
 🧪 UI LOGGER (Renderer-side)
 --------------------------------------------------------------
 WHAT THIS IS:
 - A tiny logger you can call from any renderer file to record
   UI/IPC/chart errors into: tracker/data/ui-errors.log

 WHY:
 - Backend logs (logger.js) don't capture errors that happen
   inside the Electron window (renderer). This fills that gap.

 HOW TO USE:
 1) Place this file at: /tracker/electron/modules/uiLogger.js
 2) In your renderer file:
      const { logUIError } = require("./modules/uiLogger");
 3) Call:
      logUIError("Message", { extra: "context" });

 NOTES:
 - Writes to ../data/ui-errors.log relative to /electron/
 - Safe to call often; it appends with timestamps.
 ------------------------------------------------------------- */

const fs = require("fs");
const path = require("path");

// Path: tracker/electron/modules/.. → tracker/data/ui-errors.log
const logDir = path.join(__dirname, "..", "..", "data");
const logFile = path.join(logDir, "ui-errors.log");

// Ensure folder exists
function ensureDir() {
	try {
		fs.mkdirSync(logDir, { recursive: true });
	} catch (e) {
		// As a last resort, print to console
		console.error("[UI-LOG] Failed to create data dir:", e);
	}
}

// Timestamp helper (YYYY-MM-DD HH:mm:ss)
function ts() {
	const now = new Date();
	const date = now.toLocaleDateString("en-CA"); // YYYY-MM-DD
	const time = now.toLocaleTimeString("en-GB", { hour12: false });
	return `${date} ${time}`;
}

// Safe stringify for context objects
function toJSON(val) {
	try {
		return JSON.stringify(val);
	} catch {
		return String(val);
	}
}

function logUIError(message, context = null) {
	try {
		ensureDir();
		const line =
			`[${ts()}] [UI-ERROR] ${message}` +
			(context ? ` | context=${toJSON(context)}` : "") +
			"\n";
		fs.appendFileSync(logFile, line, "utf8");
		// Breadcrumb for you to see in DevTools
		console.log("[UI-LOG] wrote UI-ERROR to", logFile, "|", message);
	} catch (e) {
		console.error("[UI-LOG] Failed to write UI-ERROR:", e);
	}
}

module.exports = { logUIError };
