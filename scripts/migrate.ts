import Database from "better-sqlite3";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "jev-arcade.db");
const db = new Database(dbPath);

console.log("Running migration on", dbPath);

// 1. Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    user_agent TEXT,
    total_games INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    result TEXT DEFAULT 'in_progress',
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS jev_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    game_id TEXT,
    game TEXT NOT NULL,
    state TEXT NOT NULL,
    question_id TEXT NOT NULL,
    instructions TEXT NOT NULL,
    criteria_json TEXT NOT NULL,
    choice TEXT NOT NULL,
    confidence REAL NOT NULL,
    probabilities_json TEXT NOT NULL,
    latency_ms REAL NOT NULL,
    is_correct INTEGER,
    mode TEXT NOT NULL DEFAULT 'manual',
    difficulty TEXT,
    step_index INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// 2. Add columns if missing
try {
  const cols = db.pragma("table_info(jev_calls)") as Array<{ name: string }>;
  const colNames = new Set(cols.map((c) => c.name));

  if (!colNames.has("session_id")) {
    db.exec("ALTER TABLE jev_calls ADD COLUMN session_id TEXT;");
    console.log("Added session_id column to jev_calls");
  }
  if (!colNames.has("game_id")) {
    db.exec("ALTER TABLE jev_calls ADD COLUMN game_id TEXT;");
    console.log("Added game_id column to jev_calls");
  }
} catch (err) {
  console.error("Column check error:", err);
}

// 3. Create indices
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_jev_calls_game ON jev_calls(game);
  CREATE INDEX IF NOT EXISTS idx_jev_calls_session_id ON jev_calls(session_id);
  CREATE INDEX IF NOT EXISTS idx_jev_calls_game_id ON jev_calls(game_id);
  CREATE INDEX IF NOT EXISTS idx_jev_calls_created_at ON jev_calls(created_at);
  CREATE INDEX IF NOT EXISTS idx_games_session_id ON games(session_id);
`);

console.log("Migration finished successfully!");
