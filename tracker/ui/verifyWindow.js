// tracker/verifyWindow.js
const { ipcRenderer, shell } = require("electron");
const { exec } = require("child_process");
const path = require("path");

require("../electron/modules/signatureBanner");

// Listen for health data from the main process
ipcRenderer.on("health-data", (_, health) => {
	const indicator = document.getElementById("indicator");
	const statusText = document.getElementById("statusText");
	const recentRuns = document.getElementById("recentRuns");

	indicator.className = `indicator ${health.color}`;
	statusText.textContent = health.message;

	recentRuns.innerHTML = "";
	if (health.recent && health.recent.length) {
		for (const run of health.recent) {
			const li = document.createElement("li");
			const icon =
				run.status === "success" ? "✅" : run.status === "failed" ? "❌" : "⚠️";
			li.textContent = `${icon} ${run.finished_at} | ${run.scanned_repos} repos | ${run.duration_ms} ms`;
			recentRuns.appendChild(li);
		}
	}
});

// --- Buttons ---
document.getElementById("viewLogBtn").addEventListener("click", () => {
	ipcRenderer.send("open-log");
});

document.getElementById("retryBtn").addEventListener("click", () => {
	ipcRenderer.send("retry-tracker");
});

// ==========================================
// Auto log viewer — receives today's log text
// ==========================================
ipcRenderer.on("show-log", (_, content) => {
	const logBox = document.getElementById("logViewer");
	if (content && content.trim().length > 0) {
		logBox.textContent = content;
	} else {
		logBox.innerHTML = "<i>⚠️ No log file found for today.</i>";
	}
});
document.getElementById("openDashboardBtn").addEventListener("click", () => {
	const vbsPath = path.join(__dirname, "..", "..", "LaunchDashboard.vbs");

	exec(`wscript.exe "${vbsPath}"`, (err) => {
		if (err) {
			console.error("❌ Failed to launch dashboard:", err.message);
			alert("Failed to launch dashboard. Please check LaunchDashboard.vbs.");
		} else {
			console.log("✅ Dashboard launched successfully.");
			window.close(); // optional: close verify window after opening dashboard
		}
	});
});
