# Git-Tracker v2 — Step 1 Report (Database & Schema)

**Goal:** Create a reliable local database (SQLite) to store daily Git activity for each repo and combined totals.

---

## ✅ What We Set Up
- Created project folders:
  ```text
  tracker/
   ├─ db/      # DB code (index.js, migrate.js, optional smoke.js)
   └─ data/    # Stores gittracker.db
  ```
- Installed **better-sqlite3** and wrote:
  - `tracker/db/index.js` → opens/creates the DB file and sets useful SQLite pragmas.
  - `tracker/db/migrate.js` → ensures all tables exist.
- Ran `npm run migrate` → created `tracker/data/gittracker.db`.

### Database Tables (Schema)
- **repos** — list of tracked repos (path, name, active flag).
- **runs** — each tracker execution (time, success/failure, errors, duration).
- **daily_repo_stats** — per-repo per-day numbers (insertions, deletions, edits, commits).
- **daily_totals** — combined per-day numbers across all repos.
- **settings** — simple key/value config storage (e.g., timezone, root path).

> Notes:
> - Unique constraints prevent duplicates: one row per repo per day; one daily total per date.
> - This makes daily runs **idempotent** (safe to run multiple times).

---

## 🧪 Optional Smoke Test (we kept it)
- File: `tracker/db/smoke.js`
- Inserts a dummy repo and one day of fake stats + totals.
- Purpose: Quick sanity check that inserts and “overwrite same day” logic work.

---

## 🐞 Problems Encountered (and Fixes)
- **Issue:** `npx sqlite3 tracker/data/gittracker.db ".tables"` failed (CLI not installed).
  - **Fix:** Used **DB Browser for SQLite** to open `gittracker.db` and confirm tables exist.
- **Understanding barrier:** SQL looked scary at first.
  - **Fix:** We walked through each table and constraint in plain English, plus a diagram of how they connect.

---

## 🔒 Decisions Locked In (from our roadmap)
- Timezone/day boundary: **Asia/Colombo** (local day 00:00–23:59).
- Track **all repos** found under one main root folder (recursively); new repos auto-included.
- Local-only app (no Supabase/cloud). Packaging to `.exe` is **optional** at the end.
- Reliability: 11:00 PM main tracker + 11:15 PM verification with **auto-recovery** popup.
- Dashboard will include a **manual "Run Tracker Now"** button.
- Repo-level contributions (pie chart) are included later.

---

## 🧭 What’s Next (Step 2 Preview)
**Repository Scanner:** a script that walks your chosen root folder, finds every `.git` directory (including new ones later), and keeps `repos` table updated. We’ll keep it simple and test-driven.

> You’re doing great. Small steps, strong foundation. On to Step 2! 🚀
