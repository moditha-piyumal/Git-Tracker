// tracker/utils/logger.js
const fs = require("fs");
const path = require("path");

// 1️⃣ Determine where logs should live
const logDir = path.join(__dirname, "..", "data", "logs");
fs.mkdirSync(logDir, { recursive: true }); // create folder if missing

// 2️⃣ Helper: format current timestamp (e.g. 2025-10-20 23:05:12)
function getTimestamp() {
	const now = new Date();
	const date = now.toLocaleDateString("en-CA"); // YYYY-MM-DD
	const time = now.toLocaleTimeString("en-GB", { hour12: false }); // 24h time
	return `[${date} ${time}]`;
}

// 3️⃣ Get today's log file path (rotates daily)
function getLogFilePath() {
	const today = new Date().toLocaleDateString("en-CA");
	return path.join(logDir, `tracker-${today}.log`);
}

// 4️⃣ Core writer (append + print to console)
function write(level, message) {
	const line = `${getTimestamp()} [${level}] ${message}\n`;
	fs.appendFileSync(getLogFilePath(), line, "utf8");
	console.log(line.trim()); // mirror to console
}

// 5️⃣ Friendly methods
const log = {
	info: (msg) => write("INFO", msg),
	warn: (msg) => write("WARN", msg),
	error: (msg) => write("ERROR", msg),

	// visually separate sections
	section: (title) => {
		const divider = "=".repeat(40);
		const text = `▶ ${title}`;
		const block = `\n${divider}\n${text}\n${divider}\n`;
		fs.appendFileSync(getLogFilePath(), block, "utf8");
		console.log(block);
	},
};

module.exports = log;
