# Git-Tracker v2 — Step 3 Report (Core Tracker Logic)

**Goal:** Teach the tracker to measure daily coding activity (lines added, removed, edited, and commits) across all repositories and save them to the database.

---

## ✅ What We Built

### Folder structure update
```text
tracker/
 ├─ db/
 │   ├─ index.js          # Database connection
 │   ├─ migrate.js        # Creates schema
 │   └─ smoke.js          # Optional DB test
 ├─ data/
 │   └─ gittracker.db     # SQLite database file
 ├─ repoScanner.js        # Finds and records Git repositories
 └─ coreTracker.js        # NEW: Measures daily coding activity
```

---

## 🧩 Step-by-Step Summary

### 🧱 Part 1–2: Setup and Imports
```js
const db = require('./db/index');
const { execSync } = require('child_process');
const path = require('path');
```
- Connected to the database.
- Imported tools for running Git commands and handling file paths.

### 🧩 Part 3: Get Active Repositories
```js
function getActiveRepos() {
  const stmt = db.prepare('SELECT id, path, name FROM repos WHERE is_active = 1');
  return stmt.all();
}
```
- Retrieves all active repos from the `repos` table.
- Returns an array of `{ id, path, name }` objects for scanning.

### 🪄 Part 4: Calculate Today's Stats
```js
git log --since="<today midnight>" --numstat --no-merges
```
- Uses Git to count **lines added** and **removed** since midnight local time.
- Converts those into daily totals per repository.

#### ⏰ Timeframe Clarification
- The counter starts at **00:00 AM** (Asia/Colombo time) and runs until the script executes (11:00 PM).  
- So each run measures the day from **00:00 → 23:00**.  
- If the script runs again later the same day, it simply overwrites today’s row (idempotent).

> Optional future tweak: we can shift the start time (e.g., 4 AM) if you often code past midnight.

### 🧩 Part 5: Save Per-Repo Stats
```js
INSERT INTO daily_repo_stats (...) VALUES (...) 
ON CONFLICT(repo_id, date_yyyy_mm_dd) DO UPDATE SET ...
```
- One row per repo per day.
- Prevents duplicates; replaces the same day’s record when re-run.
- Stores 0 edits for repos without changes (important for accuracy).

### 🧩 Part 6: Save Daily Totals
```js
INSERT INTO daily_totals (...) VALUES (...) 
ON CONFLICT(date_yyyy_mm_dd) DO UPDATE SET ...
```
- One combined total per date across all repos.
- Ensures totals reflect the sum of all repo activity for that day.

### 🧱 Part 7: Main Execution
```js
for (const repo of repos) {
  const stats = getTodayStats(repo.path);
  saveDailyStats(repo.id, today, stats);
  totalAdded   += stats.added;
  totalRemoved += stats.removed;
  totalEdits   += stats.edits;
  totalCommits += stats.commits;
}
saveDailyTotals(today, { added: totalAdded, removed: totalRemoved, edits: totalEdits, commits: totalCommits });
```
- Loops through all active repos.
- Saves each repo’s stats individually.
- Accumulates totals and saves them to `daily_totals`.
- Displays a neat summary in the console.

> Example console output:
> ```
> 📊 Scanning EVA...
> 📊 Scanning DeedTranslator...
> 🔥 Total for 2025-10-22: +25 / -17 (42 edits, 3 commits)
> ```

### 🧪 Part 8: Optional Mini-Tests
| Test | Purpose | Expected Result |
|------|----------|-----------------|
| **Re-run test** | Ensure same-day overwrite works | Only one record per repo/date |
| **New-repo test** | Add a repo, re-run scanner | Appears in tracker next run |
| **Data-integrity test** | Totals = sum of all repos | Numbers match perfectly |

#### Data Integrity SQL Query
```sql
SELECT
  date_yyyy_mm_dd,
  SUM(insertions) AS sum_added,
  SUM(deletions)  AS sum_removed,
  SUM(edits)      AS sum_edits,
  SUM(commits)    AS sum_commits
FROM daily_repo_stats
WHERE date_yyyy_mm_dd = '2025-10-22'
GROUP BY date_yyyy_mm_dd;
```
- Compare these results with `daily_totals` for the same date.  
- If they match → perfect consistency ✅

---

## 🧮 Clarifications & Key Concepts

### 🧠 Lines, not words
- Git counts **lines added/removed**, not words.
- Even one-line edits count as +1 / -1 (two edits).

### 🧱 Scanned vs. Contributed Repos
- The tracker scans **all active repos** in the DB each run.
- Repos with no changes still show 0s — this is correct behavior.
- Only repos with commits contribute non-zero values to totals.

### 🕛 Time Range
- The day is considered **00:00 → 23:00 (Asia/Colombo)**.
- The 11:00 PM run captures the full day before midnight.
- The 11:15 PM verification step (Step 5) ensures the day’s data is stored before reset.

---

## ⚙️ Planned Integration Options

### Option 1 – Separate Scripts (Current Plan)
Schedule both scripts in Windows Task Scheduler:
| Time | Script | Purpose |
|------|---------|----------|
| 10:55 PM | `repoScanner.js` | Updates the `repos` table |
| 11:00 PM | `coreTracker.js` | Measures and records daily activity |
| 11:15 PM | (future) Verification Script | Ensures data integrity and recovery |

### Option 2 – Integrated Script (Future Option)
Add this line at the top of `coreTracker.js`:
```js
require('./repoScanner');
```
Then only schedule one script.  
It’ll automatically scan and track in one go.

---

## 🧭 Step 3 Achievements Summary
| Component | Function | Status |
|------------|-----------|--------|
| `getActiveRepos()` | Fetch active repos | ✅ |
| `getTodayStats()` | Gather daily Git data | ✅ |
| `saveDailyStats()` | Store per-repo daily stats | ✅ |
| `saveDailyTotals()` | Store daily total row | ✅ |
| `runTrackerForToday()` | Orchestrates full run | ✅ |
| Idempotency, accuracy, consistency | Verified through tests | ✅ |

---

## 🔒 Decisions Locked In
- Time zone fixed to **Asia/Colombo**.
- Scans all active repos each run.
- Unchanged repos contribute 0 edits.
- One run per day (11:00 PM) + verification (11:15 PM).
- Re-runs safe (overwrite same-day data).
- Separate scheduling for scanner and tracker (for now).

---

## 🧭 What’s Next (Step 4 Preview)
**Automation + Verification System:**
- Automate both scripts with Windows Task Scheduler.
- Add a verification script that runs at 11:15 PM to confirm successful data collection.
- Include an **auto-recovery popup** if the tracker fails or no data is found.
- Add lightweight logging to record success/failure each night.

> Step 3 complete — the tracker now truly measures your daily work!  
> You’ve built a functioning analytics core. 🚀
