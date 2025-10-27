# 🚀 Git‑Tracker v2 — Planned Future Improvements (Deferred)

These features were intentionally **not included** in the initial public GitHub release to keep the first version lean and focused. They remain **valuable planned enhancements** for future updates (v2.x → v3.x).

---

## 🧩 **A. Dashboard & UI Enhancements (Deferred)**

1. **About Section** – Add version info, author credits (Moditha Wijeratne), and GitHub link in a footer or modal.
3. **Screenshot / Export Button** – Allow exporting any chart as an image (`chart.toBase64Image()` → Save Dialog).
5. **Summary Card (Today’s Totals)** – Display today’s total edits and commits at the top of the dashboard.
7. **Chart Fade‑in Animations** – Add subtle transitions for chart rendering or refresh.
8. **Mobile Responsiveness** – Improve font scaling and layout on smaller screens.
9. **Theme Accent Variable** – Introduce a `--accent-color` CSS variable to tweak theme colors easily.
10. **Zoom / Pan in Dashboard Charts** – Add chartjs‑plugin‑zoom support to main dashboard charts (currently only in History view).

---

## ⚙️ **B. Functionality & Reliability (Deferred)**

11. **Automatic Monthly DB Backup** – Copy `gittracker.db` to `/data/backups/gittracker‑YYYY‑MM.db`.
12. **DB Integrity Check Command** – Add menu option to run `PRAGMA integrity_check;` and show results.
13. **Toast / Modal for Run Failures** – Notify the user inside the dashboard if a run fails.
14. **Retry Logic for Manual Runs** – If the tracker exits with non‑zero code, prompt to retry.
16. **Run History Pagination / Filtering** – View more than 30 runs (e.g., last 50, 100, or all).
17. **Auto‑Refresh Timer** – Optionally refresh charts every 30–60 minutes if dashboard stays open.
18. **Selectable Base Folder Path** – Let user browse and change repo root path via settings UI.
19. **Confirmation Popup Before Manual Run** – Prevent accidental executions.
20. **Progress Feedback During Manual Run** – Show live progress (e.g., scanning 3/12 repos).

---

## 📦 **C. Packaging & Release (Deferred)**

21. **Electron Builder Config** – Add `build` section to `package.json` (appId, icon, asar, extraResources).
27. **Smoke Test Script** – Simple Node test to ensure packaged app launches correctly.
28. **Installer Icon & Splash Screen** – Custom branding for the Windows installer.
29. **Dual‑Module Build Verification** – Automated check to ensure Node vs. Electron module separation remains valid.
30. **Dashboard Footer Info** – Auto‑display version number and build date from `package.json`.

---

### 🧭 Notes
- These items can be tackled in **v2.1 (stability polish)** and **v3.0 (UI expansion)** milestones.
- Each enhancement is modular and can be added without breaking existing database or tracker logic.
- Current public release focuses on functionality, reliability, and visual clarity.

---

**Planned by:** Moditha Wijeratne  
**Date:** October 2025  
**Version:** v2.0‑Deferred Improvements

