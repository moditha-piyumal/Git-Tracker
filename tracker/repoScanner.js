// tracker/repoScanner.js
const fs = require("fs");
const path = require("path");
const db = require("./db/index"); // our database connection

// Returns true if the folder contains a ".git" directory
function isGitRepo(dirPath) {
	try {
		const gitPath = path.join(dirPath, ".git");
		return fs.existsSync(gitPath) && fs.lstatSync(gitPath).isDirectory();
	} catch {
		return false;
	}
}

// Recursively search for .git folders
function findGitRepos(baseDir) {
	const repos = [];

	function search(dir) {
		const items = fs.readdirSync(dir, { withFileTypes: true });

		for (const item of items) {
			const fullPath = path.join(dir, item.name);

			// Skip hidden folders or massive system dirs
			if (item.name.startsWith(".")) continue;

			if (item.isDirectory()) {
				if (isGitRepo(fullPath)) {
					repos.push(fullPath);
				} else {
					search(fullPath); // keep going deeper
				}
			}
		}
	}

	search(baseDir);
	return repos;
}

// Save found repositories into the database
function saveReposToDB(repoPaths) {
	// 1️⃣ Prepare an SQL command to insert or update (called an "upsert")
	const upsert = db.prepare(`
    INSERT INTO repos (path, name, is_active)
    VALUES (@path, @name, 1)
    ON CONFLICT(path) DO UPDATE SET
      name = excluded.name,
      is_active = 1;
  `);

	// 2️⃣ Go through every repo path we found
	for (const repoPath of repoPaths) {
		const name = path.basename(repoPath); // folder name only
		upsert.run({ path: repoPath, name }); // save to DB
	}

	// 3️⃣ Print a confirmation
	console.log(`✅ Saved ${repoPaths.length} repositories to the database.`);
}

// =============================
// STEP 2 - PART 6: Test Run
// =============================

// ⚠️ Change this to your actual folder path
const MAIN_FOLDER = "C:\\Moditha_DevHub";

// 1️⃣ Find all Git repositories
const found = findGitRepos(MAIN_FOLDER);
console.log("🔍 Found repositories:");
console.log(found);

// 2️⃣ Save them into the database
saveReposToDB(found);
