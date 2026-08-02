import { Database } from 'bun:sqlite';
import { join } from 'path';
import { mkdirSync } from 'fs';

const DATA_DIR = join(import.meta.dir, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = join(DATA_DIR, 'war-room.db');

export function initDb(): Database {
  const db = new Database(DB_PATH, { create: true });
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA busy_timeout=5000');

  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    event TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cost_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    ceo_n INTEGER NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    model TEXT,
    cost_usd REAL DEFAULT 0
  )`);

  return db;
}
