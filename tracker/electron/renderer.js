// tracker/electron/renderer.js
const Chart = require("../../electron_modules/node_modules/chart.js/auto");

const { ipcRenderer } = require("electron");

const banner = document.getElementById("statusBanner");
const summary = document.getElementById("summary");
const runBtn = document.getElementById("runBtn");

let dailyEditsChart = null; // keep a reference so we can destroy/redraw if needed

// Load dashboard data on startup
async function loadDashboardData() {
	const data = await ipcRenderer.invoke("get-dashboard-data");
	if (data.ok) {
		banner.textContent = data.message;
		summary.textContent = `📅 Total Days Tracked: ${data.totalDays}`;
	} else {
		banner.textContent = `⚠️ ${data.message}`;
		summary.textContent = "";
	}
}

runBtn.addEventListener("click", async () => {
	runBtn.disabled = true;
	banner.textContent = "⏳ Running tracker…";
	await ipcRenderer.invoke("run-tracker-now");
	setTimeout(loadDashboardData, 5000); // refresh after 5 s
	setTimeout(() => (runBtn.disabled = false), 6000);
});

// Initial load
loadDashboardData();
