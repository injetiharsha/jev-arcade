import { Pool } from "@neondatabase/serverless";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

const isPostgres = Boolean(connectionString);

// SQLite fallback storage path for local development when no DATABASE_URL is configured
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "jev-arcade.db");

// Global singleton handles for dev server hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var __sqliteDb: Database.Database | undefined;
}

function getSqliteInstance(): Database.Database {
  if (process.env.NODE_ENV === "development" && global.__sqliteDb) {
    return global.__sqliteDb;
  }
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Ensure tables exist in SQLite
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      user_agent TEXT,
      total_games INTEGER NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'free',
      free_calls_used INTEGER NOT NULL DEFAULT 0,
      fingerprint TEXT
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      game_type TEXT NOT NULL,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      result TEXT DEFAULT 'in_progress',
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
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

  // Ensure missing columns exist on legacy tables
  try {
    const sessionCols = sqlite.pragma("table_info(sessions)") as Array<{ name: string }>;
    const sessionColNames = new Set(sessionCols.map((c) => c.name));
    if (!sessionColNames.has("ended_at")) {
      sqlite.exec("ALTER TABLE sessions ADD COLUMN ended_at TEXT");
    }
    if (!sessionColNames.has("mode")) {
      sqlite.exec("ALTER TABLE sessions ADD COLUMN mode TEXT NOT NULL DEFAULT 'free'");
    }
    if (!sessionColNames.has("free_calls_used")) {
      sqlite.exec("ALTER TABLE sessions ADD COLUMN free_calls_used INTEGER NOT NULL DEFAULT 0");
    }
    if (!sessionColNames.has("fingerprint")) {
      sqlite.exec("ALTER TABLE sessions ADD COLUMN fingerprint TEXT");
    }

    const gameCols = sqlite.pragma("table_info(games)") as Array<{ name: string }>;
    const gameColNames = new Set(gameCols.map((c) => c.name));
    if (!gameColNames.has("completed_at")) {
      sqlite.exec("ALTER TABLE games ADD COLUMN completed_at TEXT");
    }
    if (!gameColNames.has("ended_at")) {
      sqlite.exec("ALTER TABLE games ADD COLUMN ended_at TEXT");
    }
  } catch (err) {
    console.error("[DB SQLite Migration Warning]:", err);
  }

  if (process.env.NODE_ENV === "development") {
    global.__sqliteDb = sqlite;
  }
  return sqlite;
}

/**
 * Universal Database Client supporting both Neon Serverless Postgres and local SQLite.
 */
class DatabaseClient {
  public isPostgres: boolean = isPostgres;
  private pool: Pool | null = null;
  private sqliteDb: Database.Database | null = null;

  constructor() {
    if (isPostgres && connectionString) {
      this.pool = new Pool({ connectionString });
    } else {
      this.sqliteDb = getSqliteInstance();
    }
  }

  /**
   * Helper to normalize SQL query placeholders:
   * Converts $1, $2 (Postgres syntax) or ? (SQLite syntax) appropriately.
   */
  private formatQuery(queryText: string): string {
    if (this.isPostgres) {
      // Convert ? to $1, $2, ... for Postgres
      let paramIndex = 1;
      return queryText.replace(/\?/g, () => `$${paramIndex++}`);
    } else {
      // Convert $1, $2 to ? for SQLite
      return queryText.replace(/\$\d+/g, "?");
    }
  }

  /**
   * Execute a query returning an array of rows.
   */
  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    const formatted = this.formatQuery(queryText);

    if (this.isPostgres && this.pool) {
      const result = await this.pool.query(formatted, params);
      return result.rows as T[];
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(formatted);
      return stmt.all(...params) as T[];
    }
    return [];
  }

  /**
   * Execute a query returning a single row or null.
   */
  async queryOne<T = any>(queryText: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(queryText, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Execute an INSERT/UPDATE/DELETE statement.
   */
  async execute(queryText: string, params: any[] = []): Promise<{ rowCount?: number; lastInsertId?: any }> {
    const formatted = this.formatQuery(queryText);

    if (this.isPostgres && this.pool) {
      const result = await this.pool.query(formatted, params);
      return { rowCount: result.rowCount ?? undefined };
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(formatted);
      const info = stmt.run(...params);
      return { rowCount: info.changes, lastInsertId: info.lastInsertRowid };
    }
    return {};
  }
}

export const db = new DatabaseClient();
export default db;
