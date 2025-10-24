# 🤡 Git-Tracker Architecture Plan — Option B (Worker + Dashboard)

This document explains, in beginner-friendly language, how the Git-Tracker project will look if we later move to **Option B** — a separate **Worker** and **Dashboard**, both using one shared database.

---

## 🧠 The Big Picture — Two Linked Apps Sharing One Database

```
┌───────────────────────────────────────────────────┐
│            🧠 Shared Database (SQLite)        │
│     gittracker.db   (lives in appData)       │
└───────────────────────────────────────────────────┘
            ▲                         ▲
            │                         │
     Writes new stats           Reads charts & logs
            │                         │
┌───────────────┐           ┌──────────────────────────┐
│ ⚙️  Worker EXE     │           │ 🖥️  Dashboard EXE     │
│ (coreTracker.js)  │           │ (Electron main.js)    │
│ Runs automatically│           │ Open manually or via  │
│ each night (11 PM)│           │ .vbs shortcut         │
│ No window         │           │ Beautiful charts UI   │
└───────────────┘           └──────────────────────────┘
```

---

## 🧱 What Each Part Does

### 1️⃣ **The Worker**
- Based on `coreTracker.js`, `logger.js`, `lock.js`, and `repoScanner.js`.
- Runs automatically every night (via Task Scheduler after bundling).
- Scans repos, collects stats, and writes to the same SQLite DB.
- **No UI or window.**

### 2️⃣ **The Dashboard**
- Electron app: `main.js`, `renderer.js`, `dashboard.html`.
- Displays charts and streaks.
- Can manually trigger the Worker.
- Reads data from the same database.

---

## 📂 Folder Layout (after adopting Option B)

```
git-tracker-v2/
├─ worker/
│  ├─ coreTracker.js
│  ├─ logger.js
│  ├─ lock.js
│  ├─ health.js
│  └─ repoScanner.js
│
├─ dashboard/
│  ├─ main.js
│  ├─ renderer.js
│  ├─ dashboard.html
│  └─ verifyWindow.html
│
├─ db/
│  ├─ migrate.js
│  └─ update_runs_table.js
│
├─ data/
│  ├─ gittracker.db   ← shared brain
│  └─ logs/
│
├─ package.json
└─ LaunchDashboard.vbs
```

---

## 🧩 Code Adjustments (when moving to Option B)

### 1️⃣ Shared Database Path
```js
const { app } = require("electron");
const dbPath = path.join(app.getPath("appData"), "Git-Tracker", "gittracker.db");
```

---

### 2️⃣ Worker — Make It Callable
```js
if (require.main === module) {
  runTrackerForToday();
}
module.exports = { runTrackerForToday };
```

---

### 3️⃣ Dashboard — Manual Run Button
```js
const { execFile } = require("child_process");
const path = require("path");
const workerPath = path.join(process.resourcesPath, "Git-Tracker-Worker.exe");
execFile(workerPath, ["--run-once"], (err) => { ... });
```

---

### 4️⃣ Schedule Worker Automatically
```
"C:\\Program Files\\Git-Tracker\\Git-Tracker-Worker.exe" --run-once
```
Runs nightly at 11:00 PM (via Task Scheduler).

---

### 5️⃣ Merge Verify Logic
`verifyTracker.js` can merge into the Dashboard main process, eliminating the separate schedule.

---

## 🛠️ Bundling Later (electron-builder)

```json
"build": {
  "appId": "com.gittracker.app",
  "productName": "Git-Tracker",
  "files": ["dashboard/**/*", "worker/**/*", "db/**/*"],
  "extraResources": [{ "from": "data", "to": "data" }]
}
```

---

## 🗺️ Recap Table

| Feature | How it works under Option B |
|----------|------------------------------|
| Auto run | Task Scheduler runs Worker |
| Verify | Dashboard checks DB freshness |
| Manual run | Dashboard spawns Worker |
| Shared DB | Stored in appData |
| Logs | In `%APPDATA%\\Git-Tracker\\logs` |
| Maintenance | Independent modules |

---

## 🌙 Steps You Can Do Now
1. Migrate DB path to `appData`.
2. Export `runTrackerForToday` in Worker.
3. Merge `verifyTracker` into Electron main.
4. Later, bundle both.
5. Add Task Scheduler entry for Worker.

---

**Result:**  
A clean, professional architecture where your background Worker handles nightly data collection, and your Dashboard provides motivational analytics — both sharing one brain (the database).

