# ⚙️ Git-Tracker v2 — Final 4-Step Roadmap (Revised)

---

## **Step 7 — Dashboard (Charts + Manual Run)**

### 🎯 **Goal**

Build the **main Electron dashboard** showing visual coding progress and system health, with the ability to run the tracker manually and refresh all charts live.

---

### 🧱 **Dashboard Features**

- **Manual “Run Tracker” button** (top-right)
  - Launches `coreTracker.js` securely with lock protection.
  - Displays “Running…” → success/fail result message.
  - Automatically refreshes charts and streak counter after run completion.
- **Status Banner**
  - Displays “Last Run: Success / Failed / Stale” with timestamp.
- **Streak Display**
  - Single 🔥 numeric indicator showing consecutive active days (≥1 edit).
  - Computed from `daily_totals` activity records.

---

### 📊 **Charts in Dashboard (6 total)**

#### 1️⃣ Daily Total Edits (with Moving Averages)

**Type:** Multi-Line Chart  
**Data:** `daily_totals`  
**Lines Displayed:**

- 🟢 **Lines Added**
- 🔴 **Lines Removed**
- ⚪ **Total Edits (Adds + Removes)** — thicker line
- 📈 **7-day & 30-day Moving Averages** — based only on Total Edits

**Purpose:**  
Shows daily coding activity volume and its medium/long-term trends, allowing a quick sense of momentum.

---

#### 2️⃣ Commits per Day (Last 30 Days)

**Type:** Line Chart  
**Data:** `daily_totals.commits`  
**Purpose:**  
Displays commit consistency over time — ideal for spotting gaps in daily engagement.

---

#### 3️⃣ Net Lines Over Time (Cumulative)

**Type:** Cumulative Line Chart  
**Data:** `(adds - removes)` over time  
**Purpose:**  
Visualizes overall growth or refactoring in the codebase, helping track net productivity trends.

---

#### 4️⃣ Per-Repo Contribution (Today)

**Type:** Pie Chart  
**Data:** Aggregated per-repo totals from today’s stats  
**Purpose:**  
Shows the percentage share of today’s total edits across all scanned repositories.

---

#### 5️⃣ Run Duration & Status Timeline (Last 30 Runs)

**Type:** Scatter / Line Chart  
**Data:** From `runs` table  
**Purpose:**  
Displays how long each tracker run took, color-coded by success/failure, to monitor operational reliability.

---

#### 6️⃣ Streak Counter

**Type:** Numeric Display  
**Purpose:**  
Shows 🔥 _“Current Streak: X Days”_ — calculated from consecutive active days.  
Resets automatically when a day passes without edits.

---

### 🧩 **Data Sources**

- `daily_totals` → adds, removes, edits, commits, dates.
- `runs` → success/fail, duration, timestamps.
- Derived values → total edits + 7-day and 30-day moving averages.

---

### ✅ **Acceptance Criteria**

- Dashboard opens and renders all charts with real data.
- Manual Run triggers tracker safely and shows result.
- Charts refresh immediately after a run.
- Streak counter updates accurately.

---

## **Step 8 — Live Updates & Retry System Polish**

### 🔁 **Enhancements**

- Real-time spinner and “Tracker Running…” indicator.
- Disable Run button while tracker is executing.
- Auto-refresh all charts and streak counter upon completion.
- Display success/failure message dynamically.
- Single dark theme; no UI toggles.
- Graceful handling of concurrent run attempts or failed processes.

---

### ✅ **Acceptance**

- UI reflects real-time run state.
- Charts update seamlessly after runs.
- No concurrent runs allowed.

---

## **Step 9 — Settings & Packaging Preparation**

### ⚙️ **Settings**

- Dashboard automatically scans **all repos inside the hardcoded base folder**.
- No UI for adding/removing repos — automatic detection only.
- One consistent dark theme (no toggle).
- Local configuration for schedule time and folder path if needed.

---

### 📦 **Packaging**

- Maintain dual-module setup:
  - `node_modules/` for Node runtime
  - `electron_modules/` for Electron runtime
- Include Electron modules via `extraResources` in `electron-builder`.
- Configure packaging: `appId`, icons, asar, versioning.

---

### ✅ **Acceptance**

- Bundled `.exe` works independently (no Node install needed).
- Tracker and dashboard both function correctly post-install.

---

## **Step 10 — Tests & Release**

### 🧪 **Testing**

1. **Unit Tests (Node):** logger, lock, health, streak calculator, DB access.
2. **Integration Tests:** verify daily_totals and runs updates after simulated run.
3. **UI Smoke Tests (Electron):** open dashboard, trigger manual run, check live updates.
4. **Manual QA Checklist:** cold start, failed run handling, missing log day, chart accuracy.

---

### 🧾 **Release Checklist**

- All tests green.
- Version `v2.0.0` finalized.
- Documentation and screenshots updated.
- Installer verified on a clean machine.

---

## ✅ **Dashboard Chart Summary**

| #   | Chart Name                                   | Type          | Description                                                                                              |
| --- | -------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | **Daily Total Edits (with Moving Averages)** | Multi-line    | Shows Lines Added, Lines Removed, Total Edits (thick line), and 7/30-day moving averages of Total Edits. |
| 2   | **Commits per Day (30 Days)**                | Line          | Visualizes commit activity and consistency.                                                              |
| 3   | **Net Lines Over Time (Cumulative)**         | Line          | Tracks codebase growth vs. cleanup trend.                                                                |
| 4   | **Per-Repo Contribution (Today)**            | Pie           | Displays each repository’s share of today’s edits.                                                       |
| 5   | **Run Duration & Status Timeline**           | Scatter/Line  | Displays nightly run duration and success/failure trend.                                                 |
| 6   | **Streak Counter**                           | Numeric Badge | Shows 🔥 current active-day streak count.                                                                |

---

### 💡 Notes

- No log viewer inside dashboard by default (can be added as optional future feature).
- All repositories under the predefined folder are scanned automatically.
- Dark theme only for consistency and clarity.
- 7-day and 30-day moving averages calculated for **Total Edits only**.

---

**✅ Finalized by:** Moditha & ChatGPT  
**Date:** October 2025  
**Version:** v2.0 — Dashboard Phase Ready
