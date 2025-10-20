// Renderer for the verification popup
const { ipcRenderer } = require("electron");

ipcRenderer.on("verification-mode", (_event, mode) => {
	const title = document.getElementById("title");
	const message = document.getElementById("message");
	const buttons = document.getElementById("buttons");
	const container = document.getElementById("container");

	buttons.innerHTML = ""; // clear buttons

	if (mode === "success") {
		container.style.border = "3px solid #4caf50";
		title.textContent = "🎉 Tracker Completed";
		message.textContent = "All data for today has been recorded successfully.";
		const closeBtn = document.createElement("button");
		closeBtn.textContent = "Close";
		closeBtn.className = "success";
		closeBtn.onclick = () => window.close();
		buttons.appendChild(closeBtn);
	}

	if (mode === "fail") {
		container.style.border = "3px solid #ff9800";
		title.textContent = "⚠️ Tracker Missing Data";
		message.textContent = "No record found for today. Would you like to retry?";
		const retryBtn = document.createElement("button");
		retryBtn.textContent = "Retry Now";
		retryBtn.className = "retry";
		retryBtn.onclick = () => ipcRenderer.send("retry-tracker");

		const closeBtn = document.createElement("button");
		closeBtn.textContent = "Close";
		closeBtn.className = "close";
		closeBtn.onclick = () => window.close();

		buttons.appendChild(retryBtn);
		buttons.appendChild(closeBtn);
	}
});
