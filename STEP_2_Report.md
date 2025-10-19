# Git-Tracker v2 — Step 2 Report (Repository Scanner)

**Goal:** Teach the Git-Tracker how to find every local Git repository automatically and store their paths in the database.

---

## ✅ What We Built

### Folder structure remains:
```text
tracker/
 ├─ db/
 │   ├─ index.js       # Database connection
 │   ├─ migrate.js     # Creates schema
 │   └─ smoke.js       # Test script (optional)
 ├─ data/
 │   └─ gittracker.db  # SQLite database file
 └─ repoScanner.js     # NEW: Finds and records Git repositories
```

---

## 🧩 Step-by-Step Summary

### 🧱 Part 1: File Setup
- Created a new file `tracker/repoScanner.js`.
- Imported `fs`, `path`, and the existing `db` connection.

### 🪄 Part 2: Helper to Detect Git Repositories
```js
function isGitRepo(dirPath) {
  const gitPath = path.join(dirPath, '.git');
  return fs.existsSync(gitPath) && fs.lstatSync(gitPath).isDirectory();
}
```
- Checks whether a folder has a `.git` directory.
- Returns `true` if it’s a Git repository, `false` otherwise.

### 🧱 Part 3: Recursive Folder Scanner
- Wrote a `findGitRepos(baseDir)` function that walks through all subfolders.
- It skips hidden/system folders (names starting with `.`).
- If a `.git` folder is found, that path is added to a `repos` array.
- Returns a list of repository paths.

> Example result:
> ```js
> [
>   "C:\Projects\EVA",
>   "C:\Projects\DeedTranslator",
>   "C:\Projects\LifeGamifier"
> ]
> ```

### 🧩 Part 5: Save Repos to Database
```js
function saveReposToDB(repoPaths) {
  const upsert = db.prepare(`
    INSERT INTO repos (path, name, is_active)
    VALUES (@path, @name, 1)
    ON CONFLICT(path) DO UPDATE SET
      name = excluded.name,
      is_active = 1;
  `);

  for (const repoPath of repoPaths) {
    const name = path.basename(repoPath);
    upsert.run({ path: repoPath, name });
  }

  console.log(`✅ Saved ${repoPaths.length} repositories to the database.`);
}
```
- Uses an **UPSERT** so duplicates aren’t created.
- Automatically reactivates repos that were previously marked inactive.
- Keeps the database clean and synchronized.

### 🧩 Part 6: Combine and Test
```js
const MAIN_FOLDER = "C:\Projects"; // Change this to your real folder
const found = findGitRepos(MAIN_FOLDER);
console.log(found);
saveReposToDB(found);
```
- Runs the scanner and saves all repos found under the main folder.
- Console output example:
  ```
  🔍 Found repositories:
  [ 'C:\Projects\EVA', 'C:\Projects\DeedTranslator' ]
  ✅ Saved 2 repositories to the database.
  ```

### 🧠 Verification
- Opened `gittracker.db` in DB Browser for SQLite.
- Checked the `repos` table → saw all found repository paths listed with names and timestamps.

---

## 🐞 Problems Encountered (and Fixes)
- **Challenge:** Understanding recursion inside `findGitRepos()`.
  - **Fix:** We explained it line-by-line, visually showing how it walks through folders.
- **Potential issue:** Access-denied folders or hidden directories.
  - **Fix:** Skipped dot-prefixed folders and wrapped `isGitRepo` in `try/catch` to avoid crashes.

---

## 🔒 Decisions Locked In
- Scanner must include **newly created repos** automatically.
- Each repo path is **unique** (no duplicates).
- Hidden/system folders are ignored.
- Database updates are **idempotent** (safe to rerun anytime).

---

## 🧭 What’s Next (Step 3 Preview)
**Core Tracker Logic:**  
Use the repo list to calculate:
- Lines added, removed, and edited for each day.  
- Number of commits per repo.  
- Then write those stats into the database tables `daily_repo_stats` and `daily_totals`.

> Step 2 completed successfully — your tracker can now *see* all your projects.  
> Next, we’ll teach it to *measure* them. 🚀
