import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT,
    developer_status TEXT,
    simba_usage TEXT,
    is_owner INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
`;

let db: DatabaseSync | undefined;
const afterInit: Array<() => void> = [];

export function afterDatabaseInit(fn: () => void) {
  afterInit.push(fn);
}

function isCloudflareWorkers(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

function openFileDatabase(): DatabaseSync | undefined {
  try {
    const dataDir = path.join(process.cwd(), "data");
    mkdirSync(dataDir, { recursive: true });
    const fileDb = new DatabaseSync(path.join(dataDir, "simba.db"));
    fileDb.exec("PRAGMA journal_mode = WAL");
    return fileDb;
  } catch {
    return undefined;
  }
}

function openDatabase(): DatabaseSync {
  if (!isCloudflareWorkers()) {
    const fileDb = openFileDatabase();
    if (fileDb) {
      return fileDb;
    }
  }

  return new DatabaseSync(":memory:");
}

export function getDb() {
  if (!db) {
    db = openDatabase();
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(SCHEMA);
    for (const fn of afterInit) {
      fn();
    }
  }
  return db;
}
