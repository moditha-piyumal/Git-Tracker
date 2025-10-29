// tracker/electron/renderer.js
const Chart = require("../../electron_modules/node_modules/chart.js/auto");
const { ipcRenderer } = require("electron");
const { logUIError } = require("./modules/uiLogger"); // 🧪 Renderer-side error logger

require("./modules/signatureBanner");

// ✅ GLOBAL LEGEND TOGGLE ENABLEMENT
// -------------------------------------------------------------
// Chart.js already supports clicking legend items to hide/show
// datasets by default. However, depending on plugin order or
// how charts are initialized, that behavior may appear disabled.
//
// The line below enforces the toggle behavior globally so all
// charts — Daily Edits, Commits, Net Lines, Pie, etc. — respond
// consistently to legend clicks.
//
// 🧠 Why this matters:
// In October 2025, we noticed enabling toggles for the Daily
// Edits chart also reactivated toggling for other charts. To
// prevent confusion in future versions, this global default
// makes that behavior explicit and reliable.
//
Chart.defaults.plugins.legend.onClick = function (evt, legendItem, legend) {
	const index = legendItem.datasetIndex;
	const chart = legend.chart;
	const meta = chart.getDatasetMeta(index);
	meta.hidden = meta.hidden === null ? true : null;
	chart.update();
};
// 🧩 GLOBAL RENDERER ERROR LISTENERS
window.addEventListener("error", (e) => {
	console.log("[UI-LOG] window.onerror captured:", e.message);
	logUIError(e.message, {
		filename: e.filename,
		line: e.lineno,
		column: e.colno,
		stack: e.error?.stack || null,
	});
});

window.addEventListener("unhandledrejection", (e) => {
	console.log("[UI-LOG] unhandledrejection captured");
	logUIError("Unhandled Promise rejection", {
		reason: e.reason?.stack || e.reason || "Unknown reason",
	});
});

// -------------------------------------------------------------

const banner = document.getElementById("statusBanner");
const summary = document.getElementById("summary");
const runBtn = document.getElementById("runBtn");
const openHistoryBtn = document.getElementById("openHistoryBtn");

const loadingOverlay = document.getElementById("loadingOverlay");
const motivationMessage = document.getElementById("motivationMessage");

const motivationalQuotes = [
	// ⚔️ Determination & Ambition
	"A dragon does not fear the storm — it becomes the storm. 🐉",
	"Fire made me, and fire will not break me. 🔥",
	"The Iron Throne is not taken by luck — it’s earned line by line of code. 👑",
	"Every error you fix is another sword forged in your arsenal. ⚔️",
	"A Targaryen stands tall not because of blood, but because of will. 💪",
	"Victory favors those who write, test, and rise again. 🛠️",
	"You’re not just coding — you’re conquering realms unseen. 🌌",
	"There’s no victory without the burns of battle. 🔥",
	"Conquer your fear, or it will conquer you. 🐉",
	"Each commit is a claim to your own Iron Throne. 🧱",

	// 💡 Persistence & Growth
	"Even a dragon must learn to crawl before it flies. 🐣",
	"Progress may be slow, but dragons do not rush their fire. 🐲",
	"A day without growth is a day the storm wins. 🌧️",
	"Burn your doubts before they burn your dreams. 🔥",
	"The climb is long, but every line brings you closer to the peak. 🏔️",
	"Code like Rhaenyra fought — with fire and purpose. 👑",
	"When you fall, rise again — stronger, wiser, sharper. 🗡️",
	"Not every day brings glory, but every day brings progress. ⏳",
	"There are no small victories, only steps toward the crown. 🏆",
	"Patience tempers fire into power. 🔥",

	// 🧠 Wisdom & Learning
	"Learn as the maesters learned — through failure and flame. 📜",
	"Knowledge is your Valyrian steel — unbreakable, sharp, and rare. ⚙️",
	"Even the smallest script can change the course of kingdoms. 📜",
	"Those who read the code write the future. 🧠",
	"Your errors are lessons carved into history. ✍️",
	"You learn more from the ashes than from the crown. 🌑",
	"A wise coder bends before the bug — then breaks it. 🐛",
	"The dragons of knowledge sleep within your code. 🐉",
	"When you debug, you sharpen your sword. ⚔️",
	"Books or code — both are power, if you know how to read them. 📚",

	// 💀 Resilience in Struggle
	"The night is dark, but your fire burns bright. 🌙🔥",
	"When despair whispers, remind it who you are. 👑",
	"Even when all seems lost, your spark remains. 💫",
	"Stand firm — winter tests the strong. ❄️",
	"A coder’s watch never ends. 🕯️",
	"You may bend, but you will not break. 🪶",
	"Dragons rise from ashes — not comfort. 🐉",
	"No storm lasts forever, but strength forged in it does. ⛈️",
	"Hold fast. The dawn always follows the long night. 🌅",
	"You’ve faced worse monsters than this bug. 🐲",

	// 🐉 Power & Identity
	"Remember who you are, and let it be your armor. ⚔️",
	"You were born to create fire from nothing. 🔥",
	"A true Targaryen does not seek permission — only purpose. 👑",
	"Fear cuts deeper than failure. Never yield to it. 🩸",
	"You are your own house, your own name, your own power. 🏰",
	"The world bends to those who dare to build it. 🌍",
	"Others write history — you code it. 💻",
	"Power is not given; it’s compiled from persistence. ⚙️",
	"Forge your destiny in the heat of your own ambition. 🔥",
	"A mind on fire builds empires unseen. 🧠🔥",

	// 💬 Legacy & Vision
	"Leave a mark worthy of song — even if no bard ever sings it. 🎶",
	"You’re not writing code; you’re writing your story. 📜",
	"The legacy of fire is not destruction, but rebirth. 🔥",
	"One day, someone will stand on what you built — make it strong. 🧱",
	"Your name will echo through the projects you complete. 💻",
	"Great houses fall, but great work endures. 🕯️",
	"Every masterpiece begins with one line. ✍️",
	"Do not wait for destiny — compile it yourself. 💡",
	"Your code may outlive kingdoms. 🏰",
	"Dreams are ideas that refuse to die. 🌙",

	// 🪶 Reflection & Balance
	"Fire without control burns the coder too. ⚖️",
	"Even dragons need rest before the next flight. 💤",
	"Know when to fight, and when to breathe. 🌬️",
	"Your health fuels your flame — protect it. ❤️‍🔥",
	"Balance sharpens the edge of your ambition. ⚔️",
	"Victory means nothing if you forget why you started. 🕊️",
	"Discipline, not rage, wins the throne. 👑",
	"Write with passion, debug with patience. 🧘",
	"A calm mind tames wild fire. 🔥🧠",
	"Greatness is built in silence — not chaos. 🌌",

	// 🏰 Leadership & Courage
	"Command your code as a king commands his banners. ⚔️",
	"Leadership begins with accountability. 🏰",
	"Courage is not the absence of fear, but the mastery of it. 🐉",
	"A leader’s strength lies in their consistency. 🔥",
	"Let your work speak louder than your crown. 👑",
	"Dragons fly highest when the winds resist. 🌪️",
	"In every coder, a dragon sleeps — wake yours. 🐉",
	"Face your challenges as Aemond faced the storm — unflinching. 🌩️",
	"Every empire begins with one fearless decision. 💥",
	"Courage writes the history ambition dreams of. 🩸",

	// ⚙️ Persistence & Streaks
	"Keep your streak — it’s the fire that never goes out. 🔥",
	"Seven days make a habit; seven habits make a legacy. 📆",
	"Your streak is proof you’ve not bent the knee to excuses. ⚔️",
	"The fire grows with every line you add. 🪶",
	"Breaks are for mortals — you are of fire and blood. 🐲",
	"One day missed is no defeat, but two days missed is surrender. 🕯️",
	"Protect your streak like a dragon guards its hoard. 💎",
	"The heat of your effort keeps the darkness at bay. 🌙🔥",
	"Discipline is the true heir to the throne. 👑",
	"Code today, rise tomorrow — the realm remembers consistency. 🏰",
];

let dailyEditsChart = null;
let commitsChart = null;
let netLinesChart = null;
let repoPieChart = null;
let repoWeekChart = null;
let runTimelineChart = null;

// 🎨 Deterministic color generator — ensures same color for same repo name
function getColorForRepo(repoName) {
	let hash = 0;
	for (let i = 0; i < repoName.length; i++) {
		hash = repoName.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 65%, 55%)`;
}

// Load dashboard data on startup
async function loadDashboardData() {
	try {
		const data = await ipcRenderer.invoke("get-dashboard-data");
		if (data.ok) {
			banner.textContent = data.message;
			summary.textContent = `📅 Total Days Tracked: ${data.totalDays}`;
		} else {
			banner.textContent = `⚠️ ${data.message}`;
			summary.textContent = "";
		}
	} catch (err) {
		console.log("[UI-LOG] loadDashboardData failed:", err.message);
		logUIError("loadDashboardData failed", { stack: err.stack });
		banner.textContent = "⚠️ Failed to load dashboard data.";
	}
}

function showRandomMotivation() {
	const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
	motivationMessage.textContent = motivationalQuotes[randomIndex];
}
showRandomMotivation();
runBtn.addEventListener("click", async () => {
	loadingOverlay.style.display = "flex";
	runBtn.disabled = true;
	banner.textContent = "⏳ Running tracker…";

	try {
		// Run the tracker
		await ipcRenderer.invoke("run-tracker-now");

		// Wait briefly, then refresh everything
		setTimeout(async () => {
			await loadDashboardData();
			await renderDailyEdits();
			await renderCommitsChart();
			await renderNetLinesChart();
			await renderRepoPieChart();
			await renderRepoWeekChart();
			await renderRunTimelineChart();
			await renderStreak();

			runBtn.disabled = false;
			loadingOverlay.style.display = "none";
		}, 4000);
	} catch (err) {
		console.error("Tracker run error:", err);
		banner.textContent = "⚠️ Run failed. Check logs for details.";
		runBtn.disabled = false;
		loadingOverlay.style.display = "none";
	}
});

openHistoryBtn.addEventListener("click", () => {
	ipcRenderer.send("open-history-window");
});

// -------------------------------------------------------------
// 🟢 DAILY EDITS CHART
// -------------------------------------------------------------
async function renderDailyEdits() {
	console.log(
		"Rendering daily edits chart at",
		new Date().toLocaleTimeString()
	);

	if (dailyEditsChart) dailyEditsChart.destroy();

	const res = await ipcRenderer.invoke("get-daily-edits", { days: 120 });
	if (!res.ok) {
		summary.textContent = res.message || "Failed to load chart data.";
		return;
	}

	const { labels, added, removed, edits, ma7, ma30 } = res;
	const ctx = document.getElementById("dailyEditsChart").getContext("2d");

	dailyEditsChart = new Chart(ctx, {
		type: "line",
		data: {
			labels,
			datasets: [
				{
					label: "Lines Added",
					data: added,
					borderColor: "#4caf50",
					borderWidth: 2,
					tension: 0.25,
					pointRadius: 0,
					fill: false,
				},
				{
					label: "Lines Removed",
					data: removed,
					borderColor: "#ef5350",
					borderWidth: 1.5,
					tension: 0.25,
					pointRadius: 0,
					fill: false,
				},
				{
					label: "Total Edits (Adds + Removes)",
					data: edits,
					borderColor: "#00bcd4",
					borderWidth: 3,
					tension: 0.25,
					pointRadius: 0,
					fill: false,
				},
				{
					label: "7-day MA (Total Edits)",
					data: ma7,
					borderColor: "#eee0df",
					borderWidth: 1.5,
					borderDash: [5, 7],
					tension: 0.25,
					pointRadius: 0,
					fill: false,
				},
				{
					label: "30-day MA (Total Edits)",
					data: ma30,
					borderColor: "#ff9800",
					borderWidth: 1.5,
					borderDash: [3, 2],
					tension: 0.25,
					pointRadius: 0,
					fill: false,
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
				tooltip: { mode: "index", intersect: false },
			},
			interaction: { mode: "index", intersect: false },
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
					borderWidth: 4.5,
					borderColor: "#ff79c6",
					backgroundColor: "rgba(255, 121, 198, 0.2)", // semi-transparent fill
					fill: true,
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
					ticks: { color: "#f7ececff", autoSkip: true },
					grid: { color: "rgba(255,255,255,0.06)" },
				},
				y: {
					ticks: { color: "#f7ececff" },
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
/*  💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠
    📊  RELEVANT TO: DAILY REPO CONTRIBUTION CHART (Today)
    ⚙️  Function: renderRepoPieChart()
    🔗  Fetches: ipcRenderer.invoke("get-repo-contribution")
    🧮  Draws: Doughnut chart in <canvas id="repoPieChart">
    💬  Any edit in this block changes how the daily repo chart renders.
    💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠💠  */

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
		type: "doughnut",
		data: {
			labels,
			datasets: [
				{
					label: `Edits (${date})`,
					data: values,
					backgroundColor: labels.map((name) => getColorForRepo(name)),
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			cutout: "40%", // doughnut thickness
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
/*  💠💠💠💠💠💠💠💠💠💠💠💠💠💠 END OF "REPO CONTRIBUTION CHART — Today" 💠💠💠💠💠💠💠💠💠💠💠💠💠💠  */
/*  🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷
    📊  RELEVANT TO: WEEKLY REPO CONTRIBUTION CHART (Last 7 Days)
    ⚙️  Function: renderRepoWeekChart()
    🔗  Fetches: ipcRenderer.invoke("get-repo-contribution-week")
    🧮  Draws: Doughnut chart in <canvas id="repoChartWeek">
    🗓️  Time Range: Aggregates last 7 days (today + previous 6)
    💬  This block determines how the weekly repo chart appears.
        - Uses same palette as daily chart (makePalette()).
        - Shares tooltip and legend styling with daily chart.
        - Aggregated data comes from the main.js IPC handler.
    🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷  */
async function renderRepoWeekChart() {
	console.log(
		"Rendering weekly repo contribution chart at",
		new Date().toLocaleTimeString()
	);

	// 1️⃣ Fetch last 7 days' data
	const res = await ipcRenderer.invoke("get-repo-contribution-week");

	if (!res.ok) {
		summary.textContent = res.message || "Failed to load weekly repo data.";
		if (repoWeekChart) {
			repoWeekChart.destroy();
			repoWeekChart = null;
		}
		return;
	}

	const { labels, values, startDate, endDate } = res;

	// 🧹 Filter out repos with zero edits
	const filteredData = labels
		.map((label, i) => ({ label, value: values[i] }))
		.filter((item) => item.value > 0);

	const filteredLabels = filteredData.map((d) => d.label);
	const filteredValues = filteredData.map((d) => d.value);

	// 2️⃣ Destroy old chart if it exists
	if (repoWeekChart) {
		repoWeekChart.destroy();
		repoWeekChart = null;
	}

	// 3️⃣ Draw the doughnut chart
	const ctx = document.getElementById("repoChartWeek").getContext("2d");
	repoWeekChart = new Chart(ctx, {
		type: "doughnut",
		data: {
			labels: filteredLabels,
			datasets: [
				{
					label: `Edits (${startDate} → ${endDate})`,
					data: filteredValues,
					backgroundColor: filteredLabels.map((name) => getColorForRepo(name)),
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			cutout: "40%",
			plugins: {
				legend: {
					position: "right",
					labels: { color: "#ddd", font: { size: 13 } },
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

/*  💠💠💠💠💠💠💠💠💠💠💠💠💠💠 END OF "REPO CONTRIBUTION CHART — Weekly" 💠💠💠💠💠💠💠💠💠💠💠💠💠💠  */
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

// -------------------------------------------------------------
// FINAL INITIALIZATION
// -------------------------------------------------------------
loadDashboardData();
renderDailyEdits();
renderCommitsChart();
renderNetLinesChart();
renderRepoPieChart();
renderRepoWeekChart();
renderRunTimelineChart();
renderStreak();
