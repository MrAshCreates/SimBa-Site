import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

let sqlite: DatabaseSync | undefined;

export function openFileSqlite(): DatabaseSync {
  if (sqlite) {
    return sqlite;
  }

  try {
    const dataDir = path.join(process.cwd(), "data");
    mkdirSync(dataDir, { recursive: true });
    sqlite = new DatabaseSync(path.join(dataDir, "simba.db"));
    sqlite.exec("PRAGMA journal_mode = WAL");
  } catch {
    sqlite = new DatabaseSync(":memory:");
  }

  sqlite.exec("PRAGMA foreign_keys = ON");
  return sqlite;
}
