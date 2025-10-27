// 🩸💀 Signature Banner Module
// ---------------------------------------------------------
// Automatically adds Moditha Piyumal's signature banner
// to any Electron-rendered HTML window.
// ---------------------------------------------------------

function addSignatureBanner() {
	// Check if already exists (prevents duplicates)
	if (document.getElementById("signatureBanner")) return;

	const footer = document.createElement("footer");
	footer.id = "signatureBanner";
	footer.innerHTML = `
		🩸💀 This software was made by
		<strong>Moditha Piyumal</strong>,
		also known as
		<strong>Elpitiya Sworn Translator</strong>,
		a Freelance Developer! 💀🩸
	`;

	Object.assign(footer.style, {
		position: "fixed",
		bottom: "0",
		left: "0",
		width: "100%",
		textAlign: "center",
		background: "rgba(0, 0, 0, 0.75)",
		color: "#ccc",
		fontSize: "0.9em",
		padding: "6px 10px",
		borderTop: "1px solid rgba(255, 255, 255, 0.1)",
		zIndex: "9999",
		backdropFilter: "blur(3px)",
		transition: "opacity 0.3s ease",
		lineHeight: "1.4em",
	});

	footer.querySelectorAll("strong").forEach((s) => (s.style.color = "#8be9fd"));

	footer.addEventListener("mouseenter", () => (footer.style.opacity = "0.9"));
	footer.addEventListener("mouseleave", () => (footer.style.opacity = "1"));

	document.body.appendChild(footer);
}

// Run when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", addSignatureBanner);
} else {
	addSignatureBanner();
}
/* -------------------------------------------------------------
 🩸💀  SIGNATURE BANNER MODULE  💀🩸
 --------------------------------------------------------------
 🔧 HOW TO USE IN ANY ELECTRON APP:
 1️⃣  Copy this file into your project (recommended path):
      /electron/modules/signatureBanner.js

 2️⃣  In any renderer process file (for example renderer.js,
      dashboardRenderer.js, verifyWindow.js, etc.),
      simply import it with:
          require("./modules/signatureBanner");

 3️⃣  The banner will automatically appear at the bottom
      of the window once the DOM is loaded.
      - Works for any screen width ≥600px.
      - Adds itself only once per window.
      - No CSS file needed — all styles are applied inline.

 🧠  Optional:
      You can customize the emojis, text, or styling directly
      inside this file — all Electron windows using it will
      instantly reflect those changes.

 ------------------------------------------------------------- */
