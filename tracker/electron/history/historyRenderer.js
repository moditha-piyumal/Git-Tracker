const { ipcRenderer } = require("electron");
require("../modules/signatureBanner");
const fs = require("fs");
const path = require("path");

// 🏅 Cumulative Net LOC badge milestones
const BADGES = [
	{
		threshold: 1000,
		name: "Promising Novice",
		emoji: "🌱",
		desc: "Reached 1,000 net lines",
	},
	{
		threshold: 2000,
		name: "Resolute Builder",
		emoji: "🔧",
		desc: "Reached 2,000 net lines",
	},
	{
		threshold: 5000,
		name: "Foundation Builder",
		emoji: "🧱",
		desc: "Reached 5,000 net lines",
	},
	{
		threshold: 10000,
		name: "Momentum Maker",
		emoji: "🚀",
		desc: "Reached 10,000 net lines",
	},
	{
		threshold: 20000,
		name: "Architect of Flow",
		emoji: "⚙️",
		desc: "Reached 20,000 net lines",
	},
	{
		threshold: 50000,
		name: "The Furnace of Skill",
		emoji: "🔥",
		desc: "Reached 50,000 net lines",
	},
	{
		threshold: 70000,
		name: "Voyager of Vision",
		emoji: "🌌",
		desc: "Reached 70,000 net lines",
	},
	{
		threshold: 90000,
		name: "The Artisan Coder",
		emoji: "🧠",
		desc: "Reached 90,000 net lines",
	},
	{
		threshold: 100000,
		name: "Grandmaster of Code",
		emoji: "🏆",
		desc: "Reached 100,000 net lines",
	},
	{
		threshold: 150000,
		name: "Forever Fighter",
		emoji: "⚔️",
		desc: "Reached 150,000 net lines",
	},
	{
		threshold: 200000,
		name: "The Eternal Builder",
		emoji: "💀",
		desc: "Reached 200,000 net lines",
	},
];

// Local persistence for unlocked badges
const DATA_DIR = path.join(__dirname, "..", "data");
const BADGES_FILE = path.join(DATA_DIR, "unlocked_badges.json");

// Register zoom plugin (CDN exposes window.ChartZoom)
Chart.register(window.ChartZoom);

// Electron sometimes prefers mouse events for pan — set before chart creation
Chart.defaults.plugins.zoom.pan.events = ["mousedown", "mousemove", "mouseup"];
// -------------------------------------
function ensureDataDir() {
	try {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	} catch {}
}

function loadUnlockedBadges() {
	try {
		if (fs.existsSync(BADGES_FILE)) {
			const raw = fs.readFileSync(BADGES_FILE, "utf8");
			const arr = JSON.parse(raw);
			return Array.isArray(arr) ? arr : [];
		}
	} catch {}
	return [];
}

function saveUnlockedBadges(list) {
	try {
		ensureDataDir();
		fs.writeFileSync(BADGES_FILE, JSON.stringify(list, null, 2), "utf8");
	} catch (e) {
		console.error("[badges] Failed to save unlocked badges:", e);
	}
}

// net per day = max(0, added - removed); total = sum of daily net
function computeTotalNetLines(rows) {
	let total = 0;
	for (const r of rows) {
		const added = Number(r.added) || 0;
		const removed = Number(r.removed) || 0;
		const net = Math.max(0, added - removed);
		total += net;
	}
	return total;
}

// Given total net LOC, return the badge names that should be unlocked
function computeBadgeUnlocks(totalNet, alreadyUnlockedNames) {
	const unlocked = new Set(alreadyUnlockedNames || []);
	for (const b of BADGES) {
		if (totalNet >= b.threshold) unlocked.add(b.name);
	}
	return Array.from(unlocked);
}

function renderBadges(unlockedNames, totalNet) {
	const wrap = document.getElementById("achievementBadges");
	const empty = document.getElementById("achievementBadgesEmpty");
	if (!wrap) return;

	// Clear previous
	wrap.innerHTML = "";

	// Map names → full badge objects (in threshold order)
	const unlocked = BADGES.filter((b) => unlockedNames.includes(b.name));

	if (!unlocked.length) {
		if (empty) empty.style.display = "block";
		return;
	}
	if (empty) empty.style.display = "none";

	// Optional header-like badge showing current total
	const totalBadge = document.createElement("div");
	totalBadge.className = "badge";
	totalBadge.innerHTML = `<span class="emoji">📈</span><span class="name">Total Net</span><span class="desc"> ${totalNet.toLocaleString()} lines</span>`;
	wrap.appendChild(totalBadge);

	// Add each unlocked badge pill
	for (const b of unlocked) {
		const el = document.createElement("div");
		el.className = "badge";
		el.title = `${b.desc}`;
		el.innerHTML = `<span class="emoji">${b.emoji}</span><span class="name">${b.name}</span>`;
		wrap.appendChild(el);
	}
}

async function loadHistory() {
	// 1) Fetch full series
	const res = await ipcRenderer.invoke("get-all-daily-edits");
	if (!res.ok) {
		document.body.insertAdjacentHTML(
			"beforeend",
			`<p style="color:red;">DB Error: ${res.message}</p>`
		);
		return;
	}
	const rows = res.rows || [];
	rows.forEach((r) => {
		r.added = Number(r.added);
		r.removed = Number(r.removed);
		r.edits = Number(r.edits);
	});

	console.log("Sample DB rows:", rows.slice(0, 5));

	if (!rows.length) {
		document.body.insertAdjacentHTML(
			"beforeend",
			`<p style="color:orange;">No data found in daily_totals.</p>`
		);
		return;
	}

	// Keep original date strings for tooltips
	const dates = rows.map((r) => r.date);

	// Use linear X with explicit {x, y} points so pan/zoom works smoothly
	const added = rows.map((r) => ({
		x: new Date(r.date).getTime(),
		y: r.added,
	}));
	const removed = rows.map((r) => ({
		x: new Date(r.date).getTime(),
		y: r.removed,
	}));
	const edits = rows.map((r) => ({
		x: new Date(r.date).getTime(),
		y: r.edits,
	}));

	console.log("First few edits points:", edits.slice(0, 10));

	console.log("Sample dataset points:", edits.slice(0, 5));
	// === Badges: compute & render ===
	const totalNet = computeTotalNetLines(rows);
	const prevUnlocked = loadUnlockedBadges(); // ["Promising Novice", ...] or []
	const nowUnlocked = computeBadgeUnlocks(totalNet, prevUnlocked);

	// Persist if new badges appeared
	if (
		nowUnlocked.length !== prevUnlocked.length ||
		nowUnlocked.some((n) => !prevUnlocked.includes(n))
	) {
		saveUnlockedBadges(nowUnlocked);
	}

	// Render the strip
	renderBadges(nowUnlocked, totalNet);

	// Chart Y axis control function
	function globalHistoricalMax() {
		try {
			// Load your existing daily_totals dataset
			const dataPath = path.join(__dirname, "..", "data", "daily_totals.json");
			if (!fs.existsSync(dataPath)) return 1000; // default base max

			const raw = JSON.parse(fs.readFileSync(dataPath, "utf8"));
			let maxEdits = 0;
			for (const row of raw) {
				const adds = Number(row.added) || 0;
				const removes = Number(row.removed) || 0;
				const total = adds + removes;
				if (total > maxEdits) maxEdits = total;
			}
			// Add a 10% buffer for visibility
			return Math.ceil(maxEdits * 1.1);
		} catch (e) {
			console.warn("Could not calculate historical max:", e);
			return 1000;
		}
	}

	const ctx = document.getElementById("historyChart").getContext("2d");

	const chart = new Chart(ctx, {
		type: "line",
		data: {
			// labels are optional when using {x,y} points; tooltips use parsed.x
			datasets: [
				{
					label: "Lines Added",
					data: added,
					borderColor: "#4caf50",
					borderWidth: 1.2,
					tension: 0.25,
					pointRadius: 0,
					fill: false,
				},
				{
					label: "Lines Removed",
					data: removed,
					borderColor: "#ef5350",
					borderWidth: 1.2,
					tension: 0.25,
					pointRadius: 0,
					fill: false,
				},
				{
					label: "Total Edits",
					data: edits,
					borderColor: "#00bcd4",
					borderWidth: 2,
					tension: 0.25,
					pointRadius: 0,
					fill: false,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			parsing: false, // we already provide {x,y}
			scales: {
				x: {
					type: "time",
					time: {
						parser: "yyyy-MM-dd",
						unit: "day",
						tooltipFormat: "yyyy-MM-dd",
						displayFormats: { day: "LL-dd" },
					},
					min: new Date(rows[0].date).getTime(),
					max: new Date(rows[rows.length - 1].date).getTime(),
					title: { display: true, text: "Date", color: "#ccc" },
					ticks: { color: "#aaa", maxRotation: 0, autoSkip: true },
					grid: { color: "rgba(251, 255, 255, 0.47)" },
				},

				y: {
					title: { display: true, text: "Lines of Code", color: "#ccc" },
					ticks: { color: "#aaa" },
					beginAtZero: true,
					grid: { color: "rgba(251, 255, 255, 0.47)" },
					min: 0,
					suggestedMax: globalHistoricalMax(), // ⬅ custom function
				},
			},
			plugins: {
				legend: { labels: { color: "#ddd", font: { size: 13 } } },
				tooltip: {
					enabled: true,
					mode: "nearest", // show only one dataset point (closest to cursor)
					intersect: false, // trigger even if not exactly on the line
					backgroundColor: "#1b2b1d",
					borderColor: "#0f0",
					borderWidth: 1,
					titleColor: "#fff",
					bodyColor: "#aaffaa",
					padding: 8,
					callbacks: {
						// Tooltip title: show the date from the x-axis
						title: (items) => {
							const x = Math.round(items[0].parsed.x);
							return dates[x] ?? "";
						},
						// Tooltip body: show dataset label and value
						label: (ctx) => {
							return `${ctx.dataset.label}: ${ctx.formattedValue}`;
						},
					},
				},

				zoom: {
					pan: {
						enabled: true,
						mode: "x", // horizontal pan
					},
					zoom: {
						wheel: { enabled: true },
						pinch: { enabled: true },
						mode: "x", // horizontal zoom
					},
				},
			},
		},
	});

	// Manual horizontal pan (reliable in Electron) — keeps your preferred UX
	let isDragging = false;
	let lastX = 0;

	chart.canvas.addEventListener("mousedown", (e) => {
		isDragging = true;
		lastX = e.offsetX;
	});
	chart.canvas.addEventListener("mouseup", () => {
		isDragging = false;
	});
	chart.canvas.addEventListener("mouseleave", () => {
		isDragging = false;
	});

	chart.canvas.addEventListener("mousemove", (e) => {
		if (!isDragging) return;
		const scale = chart.scales.x;
		if (!scale) return;

		const prevPixel = lastX;
		const currPixel = e.offsetX;
		lastX = currPixel;

		// Convert pixel delta to domain units using scale mapping
		const prevVal = scale.getValueForPixel(prevPixel);
		const currVal = scale.getValueForPixel(currPixel);
		const shift = currVal - prevVal; // positive when dragging right

		// Move the visible window
		const min = (scale.options.min ?? scale.min) - shift;
		const max = (scale.options.max ?? scale.max) - shift;
		scale.options.min = min;
		scale.options.max = max;
		chart.update("none");
	});

	// Reset Zoom: reset plugin AND our manual min/max window
	document.getElementById("resetZoomBtn").addEventListener("click", () => {
		chart.resetZoom();
		chart.options.scales.x.min = undefined;
		chart.options.scales.x.max = undefined;
		chart.update();
	});

	// Close button
	document
		.getElementById("closeBtn")
		.addEventListener("click", () => window.close());
}

window.addEventListener("DOMContentLoaded", loadHistory);
