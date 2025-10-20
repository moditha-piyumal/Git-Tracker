// tracker/utils/lock.js
const fs = require("fs");
const path = require("path");

const lockPath = path.join(__dirname, "..", "data", "tracker.lock");
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

// 1️⃣ Create or verify the lock
function acquireLock() {
	try {
		if (fs.existsSync(lockPath)) {
			const stats = fs.statSync(lockPath);
			const age = Date.now() - stats.mtimeMs;

			if (age < MAX_AGE_MS) {
				// lock is fresh → another run likely active
				return { ok: false, reason: "active" };
			} else {
				// lock stale → delete and continue
				fs.unlinkSync(lockPath);
			}
		}

		const data = `PID=${process.pid}\nSTART=${new Date().toISOString()}\n`;
		fs.writeFileSync(lockPath, data, "utf8");
		return { ok: true };
	} catch (err) {
		return { ok: false, reason: "error", error: err };
	}
}

// 2️⃣ Release the lock (cleanup)
function releaseLock() {
	try {
		if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
		return true;
	} catch {
		return false;
	}
}

module.exports = { acquireLock, releaseLock };
