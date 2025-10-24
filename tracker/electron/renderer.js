// tracker/electron/renderer.js
const Chart = require("../../electron_modules/node_modules/chart.js/auto");

const { ipcRenderer } = require("electron");

const banner = document.getElementById("statusBanner");
const summary = document.getElementById("summary");
const runBtn = document.getElementById("runBtn");

let dailyEditsChart = null; // keep a reference so we can destroy/redraw if needed
let commitsChart = null;
let netLinesChart = null;
let repoPieChart = null;
let runTimelineChart = null;

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
		await renderNetLinesChart();
		await renderRepoPieChart();
		await renderRunTimelineChart();
		await renderStreak();
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

// End of the Commits Chart

async function renderNetLinesChart() {
	console.log("Rendering net lines chart at", new Date().toLocaleTimeString());

	// 1) fetch cumulative data (last 365 days by default)
	const res = await ipcRenderer.invoke("get-net-lines", {
		days: 365,
		clampAtZero: true,
	});

	if (!res.ok) {
		summary.textContent = res.message || "Failed to load net lines chart.";
		return;
	}

	const { labels, cumulative } = res;

	// 2) prevent chart stacking: destroy the old instance first
	if (netLinesChart) {
		netLinesChart.destroy();
		netLinesChart = null;
	}

	// 3) draw the chart in a stable, fixed-height container
	const ctx = document.getElementById("netLinesChart").getContext("2d");
	netLinesChart = new Chart(ctx, {
		type: "line",
		data: {
			labels,
			datasets: [
				{
					label: "Cumulative Net Lines",
					data: cumulative,
					borderWidth: 2.5, // a bit thicker to emphasize the long-term curve
					tension: 0.2, // gentle smoothing (0 = straight lines)
					pointRadius: 0, // cleaner look for long time ranges
					fill: false, // keep it a line; we can enable area fill later if you like
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false, // let .chart-wrap control height
			scales: {
				x: {
					ticks: { color: "#bbb", autoSkip: true, maxRotation: 0 },
					grid: { color: "rgba(255,255,255,0.06)" },
				},
				y: {
					ticks: { color: "#bbb" },
					grid: { color: "rgba(255,255,255,0.06)" },
					beginAtZero: true, // aligns with clampAtZero=true
				},
			},
			plugins: {
				legend: { labels: { color: "#ddd" } },
				tooltip: { mode: "index", intersect: false },
			},
			interaction: {
				mode: "index",
				intersect: false,
			},
		},
	});
}

async function renderRepoPieChart() {
	console.log(
		"Rendering repo contribution chart at",
		new Date().toLocaleTimeString()
	);

	// 1️⃣ Fetch today's data
	const res = await ipcRenderer.invoke("get-repo-contribution");

	if (!res.ok) {
		summary.textContent = res.message || "Failed to load repo contributions.";
		// Destroy old chart if it exists to clear stale data
		if (repoPieChart) {
			repoPieChart.destroy();
			repoPieChart = null;
		}
		return;
	}

	const { labels, values, date } = res;

	// 2️⃣ Clean up old chart if needed
	if (repoPieChart) {
		repoPieChart.destroy();
		repoPieChart = null;
	}

	// 3️⃣ Draw the chart
	const ctx = document.getElementById("repoPieChart").getContext("2d");
	repoPieChart = new Chart(ctx, {
		type: "pie",
		data: {
			labels,
			datasets: [
				{
					label: `Edits (${date})`,
					data: values,
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: "right",
					labels: {
						color: "#ddd",
						font: { size: 13 },
					},
				},
				tooltip: {
					callbacks: {
						label: (context) => {
							const label = context.label || "";
							const val = context.parsed;
							const total = values.reduce((a, b) => a + b, 0);
							const pct = ((val / total) * 100).toFixed(1);
							return `${label}: ${val} edits (${pct}%)`;
						},
					},
				},
			},
		},
	});
}
async function renderRunTimelineChart() {
	console.log(
		"Rendering run timeline chart at",
		new Date().toLocaleTimeString()
	);

	// 1️⃣ Fetch data from the main process
	const res = await ipcRenderer.invoke("get-run-timeline", { limit: 30 });

	if (!res.ok) {
		summary.textContent = res.message || "Failed to load run timeline chart.";
		if (runTimelineChart) {
			runTimelineChart.destroy();
			runTimelineChart = null;
		}
		return;
	}

	const { labels, durations, statuses } = res;

	// 2️⃣ Destroy old chart to prevent stacking
	if (runTimelineChart) {
		runTimelineChart.destroy();
		runTimelineChart = null;
	}

	// 3️⃣ Prepare data points for scatter plot
	const dataPoints = labels.map((label, i) => ({
		x: i + 1, // run order number (1–30)
		y: durations[i], // duration in ms
		status: statuses[i], // for color coding
	}));

	// 4️⃣ Choose colors based on success/failure
	const pointColors = dataPoints.map((p) =>
		p.status === "success" ? "#4caf50" : "#f44336"
	);

	// 5️⃣ Create the chart
	const ctx = document.getElementById("runTimelineChart").getContext("2d");
	runTimelineChart = new Chart(ctx, {
		type: "scatter",
		data: {
			datasets: [
				{
					label: "Run Duration (ms)",
					data: dataPoints,
					parsing: { xKey: "x", yKey: "y" },
					borderWidth: 2,
					borderColor: "#8be9fd",
					showLine: true, // connect dots with a line
					tension: 0.25, // slight curve for readability
					pointRadius: 5,
					pointBackgroundColor: pointColors,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: {
					title: {
						display: true,
						text: "Run Order (Old → New)",
						color: "#bbb",
					},
					ticks: {
						color: "#bbb",
						stepSize: 1,
					},
					grid: { color: "rgba(255,255,255,0.06)" },
				},
				y: {
					title: {
						display: true,
						text: "Duration (ms)",
						color: "#bbb",
					},
					ticks: { color: "#bbb" },
					grid: { color: "rgba(255,255,255,0.06)" },
					beginAtZero: true,
				},
			},
			plugins: {
				legend: { labels: { color: "#ddd" } },
				tooltip: {
					callbacks: {
						label: (ctx) => {
							const run = dataPoints[ctx.dataIndex];
							return `Run ${run.x}: ${run.y} ms (${run.status})`;
						},
					},
				},
			},
		},
	});
}
async function renderStreak() {
	console.log("Calculating streaks at", new Date().toLocaleTimeString());

	const res = await ipcRenderer.invoke("get-streak");
	const valueEl = document.getElementById("streakValue");
	const longestEl = document.getElementById("longestValue");
	const noteEl = document.getElementById("streakNote");

	if (!res || !res.ok) {
		valueEl.textContent = "—";
		longestEl.textContent = "—";
		noteEl.textContent = res?.message || "Unable to compute streaks.";
		return;
	}

	const { current, longest } = res;

	// current streak
	valueEl.textContent = `${current} day${current === 1 ? "" : "s"}`;
	// longest streak
	longestEl.textContent = `${longest} day${longest === 1 ? "" : "s"}`;

	// friendly motivational note
	if (current === 0) {
		noteEl.textContent =
			"No active streak yet. Make one edit today to start! 💪";
	} else if (current === longest) {
		noteEl.textContent = "🔥 You're at your all-time record! Keep it going!";
	} else {
		noteEl.textContent =
			"A mind needs coding like a sword needs a whetstone. Keep going!👏";
	}
}

// Initial load
loadDashboardData();
renderDailyEdits();
renderCommitsChart();
renderNetLinesChart();
renderRepoPieChart();
renderRunTimelineChart();
renderStreak();
