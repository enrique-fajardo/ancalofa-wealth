import Database from 'better-sqlite3';
import path from 'path';

// Database path: frontend/ → Code/ → FinancialAgent/ → Database/
const DB_PATH = path.join(process.cwd(), '..', '..', 'Database', 'financial_agent.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    runMigrations(_db);
  }
  return _db;
}

function runMigrations(db: Database.Database): void {
  // Chat tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      session_id   TEXT PRIMARY KEY,
      title        TEXT NOT NULL DEFAULT 'New Chat',
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      message_id   INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id   TEXT NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
      role         TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content      TEXT NOT NULL,
      tool_calls   TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS macro_history (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      indicator_id TEXT NOT NULL,
      period       TEXT NOT NULL,
      value        REAL NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(indicator_id, period)
    );
  `);

  // Add columns if they don't exist yet (safe with try/catch)
  const safeAlter = (sql: string) => { try { db.exec(sql); } catch { /* column exists */ } };
  safeAlter(`ALTER TABLE accounts ADD COLUMN first_deposit_date TEXT`);
  safeAlter(`ALTER TABLE accounts ADD COLUMN opened_date TEXT`);
  safeAlter(`ALTER TABLE accounts ADD COLUMN tracking_since TEXT`);
  safeAlter(`ALTER TABLE accounts ADD COLUMN name TEXT`);
  safeAlter(`ALTER TABLE positions ADD COLUMN interest_rate REAL`);
  safeAlter(`ALTER TABLE positions ADD COLUMN maturity_date TEXT`);
  safeAlter(`ALTER TABLE positions ADD COLUMN pnl REAL`);
  safeAlter(`ALTER TABLE positions ADD COLUMN pnl_pct REAL`);
}

export default getDb;
