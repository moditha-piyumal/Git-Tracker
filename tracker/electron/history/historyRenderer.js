const { ipcRenderer } = require("electron");

// Register zoom plugin (CDN exposes window.ChartZoom)
Chart.register(window.ChartZoom);

// Electron sometimes prefers mouse events for pan — set before chart creation
Chart.defaults.plugins.zoom.pan.events = ["mousedown", "mousemove", "mouseup"];

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
	const added = rows.map((r, i) => ({ x: i, y: r.added }));
	const removed = rows.map((r, i) => ({ x: i, y: r.removed }));
	const edits = rows.map((r, i) => ({ x: i, y: r.edits }));

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
					type: "linear",
					title: { display: true, text: "Day Index", color: "#ccc" },
					ticks: { color: "#aaa" },
				},
				y: {
					title: { display: true, text: "Edits", color: "#ccc" },
					ticks: { color: "#aaa" },
				},
			},
			plugins: {
				legend: { labels: { color: "#ddd", font: { size: 13 } } },
				tooltip: {
					callbacks: {
						// Show original ISO date in tooltip header
						title: (items) => {
							const x = Math.round(items[0].parsed.x);
							return dates[x] ?? "";
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
