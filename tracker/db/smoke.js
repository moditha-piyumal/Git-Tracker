// tracker/db/smoke.js
const db = require("./index"); // Connect to your database (gittracker.db)

// ----------------------------
// STEP 1 — Insert a dummy repo
// ----------------------------
const upsertRepo = db.prepare(`
  INSERT INTO repos (path, name, is_active)
  VALUES (@path, @name, 1)
  ON CONFLICT(path) DO UPDATE SET name = excluded.name, is_active = 1
  RETURNING id;
`);

// Create a fake repository record
const repo = { path: "C:\\Dummy\\Repo", name: "Dummy Repo" };
const { id: repoId } = upsertRepo.get(repo);

// ----------------------------
// STEP 2 — Add fake daily stats for that repo
// ----------------------------
const putDailyRepo = db.prepare(`
  INSERT INTO daily_repo_stats (repo_id, date_yyyy_mm_dd, insertions, deletions, edits, commits)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(repo_id, date_yyyy_mm_dd) DO UPDATE SET
    insertions = excluded.insertions,
    deletions = excluded.deletions,
    edits = excluded.edits,
    commits = excluded.commits;
`);

// Add one day's fake activity
putDailyRepo.run(repoId, "2025-10-19", 100, 30, 130, 2);

// ----------------------------
// STEP 3 — Add same totals to daily_totals table
// ----------------------------
const putTotals = db.prepare(`
  INSERT INTO daily_totals (date_yyyy_mm_dd, insertions, deletions, edits, commits)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(date_yyyy_mm_dd) DO UPDATE SET
    insertions = excluded.insertions,
    deletions = excluded.deletions,
    edits = excluded.edits,
    commits = excluded.commits;
`);

putTotals.run("2025-10-19", 100, 30, 130, 2);

// ----------------------------
// STEP 4 — All good!
// ----------------------------
console.log("🌱 Dummy data written successfully.");
