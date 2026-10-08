CREATE TABLE IF NOT EXISTS jev_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  state TEXT NOT NULL,
  question_id TEXT NOT NULL,
  instructions TEXT NOT NULL,
  criteria_json TEXT NOT NULL,
  choice TEXT NOT NULL,
  confidence REAL NOT NULL,
  probabilities_json TEXT NOT NULL,
  latency_ms REAL NOT NULL,
  is_correct INTEGER, -- NULL until checked/evaluated, 1 for true, 0 for false
  mode TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'autocomplete'
  difficulty TEXT, -- 'easy' | 'medium' | 'hard' | 'random'
  step_index INTEGER, -- step sequence number in an autocomplete run
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jev_calls_game ON jev_calls(game);
CREATE INDEX IF NOT EXISTS idx_jev_calls_created_at ON jev_calls(created_at);
