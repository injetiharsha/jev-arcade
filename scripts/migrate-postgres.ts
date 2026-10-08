import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.error("❌ No DATABASE_URL or POSTGRES_URL found in environment.");
  console.error("Please add your Neon connection string to .env.local and try again.");
  process.exit(1);
}

console.log("🔗 Connecting to Postgres via @neondatabase/serverless...");
const sql = neon(connectionString);

async function runMigration() {
  try {
    console.log("🚀 Creating Postgres schema tables...");

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(32) PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        user_agent TEXT,
        total_games INT NOT NULL DEFAULT 0,
        mode VARCHAR(20) DEFAULT 'free',
        free_calls_used INT NOT NULL DEFAULT 0,
        fingerprint VARCHAR(64)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(32) PRIMARY KEY,
        session_id VARCHAR(32) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        game_type VARCHAR(32) NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        result VARCHAR(20) DEFAULT 'in_progress'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS jev_calls (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(32),
        game_id VARCHAR(32),
        game VARCHAR(32) NOT NULL,
        state TEXT NOT NULL,
        question_id VARCHAR(64) NOT NULL,
        instructions TEXT NOT NULL,
        criteria_json TEXT NOT NULL,
        choice TEXT NOT NULL,
        confidence REAL NOT NULL,
        probabilities_json TEXT NOT NULL,
        latency_ms REAL NOT NULL,
        is_correct INT,
        mode VARCHAR(20) NOT NULL DEFAULT 'manual',
        difficulty VARCHAR(20),
        step_index INT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    console.log("📊 Creating indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_jev_calls_game ON jev_calls(game);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jev_calls_session_id ON jev_calls(session_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jev_calls_game_id ON jev_calls(game_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jev_calls_created_at ON jev_calls(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_games_session_id ON games(session_id);`;

    console.log("✅ Neon Postgres database schema migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
