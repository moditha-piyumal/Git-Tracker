// tracker/db/index.js
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// ensure the data folder exists
const DATA_DIR = path.join(__dirname, "..", "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

// full path to the SQLite file
const DB_PATH = path.join(DATA_DIR, "gittracker.db");

// open (or create) the database file
const db = new Database(DB_PATH);

// sensible SQLite pragmas
db.pragma("journal_mode = WAL"); // better concurrent reads
db.pragma("foreign_keys = ON"); // enforce FK constraints

module.exports = db;
