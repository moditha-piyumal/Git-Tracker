// tracker/verifyWindow.js
const { ipcRenderer, shell } = require("electron");

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
