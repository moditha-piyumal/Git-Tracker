// tracker/electron/renderer.js
const Chart = require("../../electron_modules/node_modules/chart.js/auto");

const { ipcRenderer } = require("electron");

const banner = document.getElementById("statusBanner");
const summary = document.getElementById("summary");
const runBtn = document.getElementById("runBtn");

let dailyEditsChart = null; // keep a reference so we can destroy/redraw if needed
let commitsChart = null;

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

	// wait 5 s, then refresh everything once
	setTimeout(async () => {
		await loadDashboardData();
		await renderDailyEdits();
		await renderCommitsChart();
		runBtn.disabled = false;
	}, 5000);
});
async function renderDailyEdits() {
	console.log(
		"Rendering daily edits chart at",
		new Date().toLocaleTimeString()
	);

	// destroy old chart if it exists before drawing again
	if (dailyEditsChart) {
		dailyEditsChart.destroy();
		dailyEditsChart = null;
	}

	// 1) Ask main process for data (last 120 days)
	const res = await ipcRenderer.invoke("get-daily-edits", { days: 120 });

	// 2) Handle errors
	if (!res.ok) {
		summary.textContent = res.message || "Failed to load chart data.";
		return;
	}

	const { labels, added, removed, edits, ma7, ma30 } = res;

	// 4) Create the chart
	const ctx = document.getElementById("dailyEditsChart").getContext("2d");
	dailyEditsChart = new Chart(ctx, {
		type: "line",
		data: {
			labels,
			datasets: [
				{
					label: "Lines Added",
					data: added,
					borderWidth: 1.5,
					tension: 0.25,
					pointRadius: 0,
				},
				{
					label: "Lines Removed",
					data: removed,
					borderWidth: 1.5,
					tension: 0.25,
					pointRadius: 0,
				},
				{
					label: "Total Edits (Adds + Removes)",
					data: edits,
					borderWidth: 3, // thicker line for Total
					tension: 0.25,
					pointRadius: 0,
				},
				{
					label: "7-day MA (Total Edits)",
					data: ma7,
					borderWidth: 1.5,
					borderDash: [6, 6], // dashed so it’s visually distinct
					tension: 0.25,
					pointRadius: 0,
				},
				{
					label: "30-day MA (Total Edits)",
					data: ma30,
					borderWidth: 1.5,
					borderDash: [3, 6],
					tension: 0.25,
					pointRadius: 0,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: {
					ticks: { color: "#bbb", maxRotation: 0, autoSkip: true },
					grid: { color: "rgba(255,255,255,0.06)" },
				},
				y: {
					ticks: { color: "#bbb" },
					grid: { color: "rgba(255,255,255,0.06)" },
					beginAtZero: true,
				},
			},
			plugins: {
				legend: {
					labels: { color: "#ddd", usePointStyle: true },
				},
				tooltip: {
					mode: "index",
					intersect: false,
				},
			},
			interaction: {
				mode: "index",
				intersect: false,
			},
			elements: {
				line: {
					// we don’t set explicit colors; Chart.js will auto-pick.
					// (If you want custom colors later, we can add them.)
				},
			},
		},
	});
}

// End of Daily Edits chart code

async function renderCommitsChart() {
	console.log("Rendering commits chart at", new Date().toLocaleTimeString());

	// 1️⃣  Ask the main process for data
	const res = await ipcRenderer.invoke("get-commits-chart", { days: 30 });

	if (!res.ok) {
		summary.textContent = res.message || "Failed to load commits chart.";
		return;
	}

	const { labels, commits } = res;

	// 2️⃣  Destroy any existing chart
	if (commitsChart) {
		commitsChart.destroy();
		commitsChart = null;
	}

	// 3️⃣  Draw the chart
	const ctx = document.getElementById("commitsChart").getContext("2d");
	commitsChart = new Chart(ctx, {
		type: "line",
		data: {
			labels,
			datasets: [
				{
					label: "Commits per Day",
					data: commits,
					borderWidth: 2.5,
					tension: 0.3, // gentle curve
					pointRadius: 3,
					pointHoverRadius: 5,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: {
					ticks: { color: "#bbb", autoSkip: true },
					grid: { color: "rgba(255,255,255,0.06)" },
				},
				y: {
					ticks: { color: "#bbb" },
					grid: { color: "rgba(255,255,255,0.06)" },
					beginAtZero: true,
				},
			},
			plugins: {
				legend: { labels: { color: "#ddd" } },
				tooltip: { mode: "index", intersect: false },
			},
		},
	});
}

// Initial load
loadDashboardData();
renderDailyEdits();
renderCommitsChart();
