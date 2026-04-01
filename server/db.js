const Database = require('better-sqlite3');
const path = require('path');

// The database file will be created in the current directory (server/)
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Create tables synchronously - no more connection callbacks or promise chains!
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_completions (
    task_id INTEGER,
    target_date DATE,
    actual_completion_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, target_date),
    FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE
  );
`);

console.log('SQLite database and tables initialized successfully.');

module.exports = db;
