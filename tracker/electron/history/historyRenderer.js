const { ipcRenderer } = require("electron");
const Zoom = window.ChartZoom; // correct global from CDN
Chart.register(Zoom);

const ZoomPlugin = window.ChartZoom; // ✅ correct global from CDN
Chart.register(ZoomPlugin); // ✅ register with Chart.js
console.log("Zoom plugin registered:", Chart.registry.plugins.get("zoom"));

// 🧠 Step 1 — Fetch full history
async function loadHistory() {
	console.log("Loading full history data...");
	const res = await ipcRenderer.invoke("get-all-daily-edits");
	if (!res.ok) {
		document.body.insertAdjacentHTML(
			"beforeend",
			`<p style="color:red;">DB Error: ${res.message}</p>`
		);
		return;
	}

	const rows = res.rows;
	if (!rows || !rows.length) {
		document.body.insertAdjacentHTML(
			"beforeend",
			`<p style="color:orange;">No data found in daily_totals.</p>`
		);
		return;
	}

	console.log(`Loaded ${rows.length} days of data`);

	const labels = rows.map((_, i) => i); // numeric index for x-axis

	const added = rows.map((r) => r.added);
	const removed = rows.map((r) => r.removed);
	const edits = rows.map((r) => r.edits);

	// 🧠 Step 2 — Draw chart
	const ctx = document.getElementById("historyChart").getContext("2d");
	// ✅ Force the zoom plugin to listen to standard mouse events
	Chart.defaults.plugins.zoom.pan.events = [
		"mousedown",
		"mousemove",
		"mouseup",
	];

	const chart = new Chart(ctx, {
		type: "line",
		data: {
			labels,
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
			scales: {
				x: {
					type: "linear", // ✅ switch from category to linear
					title: { display: true, text: "Day Index", color: "#ccc" },
					ticks: { color: "#aaa" },
				},
				y: {
					title: { display: true, text: "Edits", color: "#ccc" },
					ticks: { color: "#aaa" },
				},
			},
			plugins: {
				legend: { labels: { color: "#ddd" } },
				zoom: {
					pan: {
						enabled: true,
						mode: "x",
						overScaleMode: "x",
						scaleMode: "x",
						onPanStart: () => console.log("Panning…"),
					},
					zoom: {
						wheel: { enabled: true },
						pinch: { enabled: true },
						mode: "x",
					},
				},
			},
		},
	});
	// 🧠 manually handle horizontal dragging
	let isDragging = false;
	let startX = 0;

	chart.canvas.addEventListener("mousedown", (e) => {
		isDragging = true;
		startX = e.offsetX;
	});

	chart.canvas.addEventListener("mouseup", () => {
		isDragging = false;
	});

	chart.canvas.addEventListener("mousemove", (e) => {
		if (!isDragging || !chart.scales.x) return;
		const scale = chart.scales.x;
		const deltaX = e.offsetX - startX;
		startX = e.offsetX;

		const range = scale.max - scale.min;
		const pixelsPerUnit = chart.width / range;
		const shift = deltaX / pixelsPerUnit;

		scale.options.min -= shift;
		scale.options.max -= shift;
		chart.update("none");
	});
}
// 🧪 TEMP TEST — check if pointer events reach the canvas
const chartCanvas = document.getElementById("historyChart");
chartCanvas.onpointerdown = () => console.log("pointerdown fired");

window.addEventListener("DOMContentLoaded", loadHistory);

// Close button
document
	.getElementById("closeBtn")
	.addEventListener("click", () => window.close());

document.getElementById("resetZoomBtn").addEventListener("click", () => {
	const chart = Chart.getChart("historyChart");
	chart.resetZoom();
});
