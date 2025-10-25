const { ipcRenderer, remote } = require("electron");

// temporary placeholder
const ctx = document.getElementById("historyChart").getContext("2d");
ctx.font = "20px Arial";
ctx.fillStyle = "#00e0ff";
ctx.fillText("History window loaded successfully!", 30, 80);

// Close button logic
document.getElementById("closeBtn").addEventListener("click", () => {
	window.close();
});
