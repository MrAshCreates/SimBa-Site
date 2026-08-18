export type SqlValue = string | number | null;

type FileSqlite = {
  exec: (sql: string) => void;
  prepare: (query: string) => {
    get: (...params: SqlValue[]) => unknown;
    all: (...params: SqlValue[]) => unknown[];
    run: (...params: SqlValue[]) => { changes?: number | bigint };
  };
};

type D1Prepared = {
  bind: (...values: SqlValue[]) => {
    first: <T>() => Promise<T | null>;
    all: <T>() => Promise<{ results: T[] }>;
    run: () => Promise<{ meta?: { changes?: number } }>;
  };
};

type D1DatabaseBinding = {
  prepare: (query: string) => D1Prepared;
  exec: (query: string) => Promise<unknown>;
};

type CloudflareEnv = {
  DB?: D1DatabaseBinding;
  SIMBA_OWNER_PASSWORD?: string;
};

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

let sqlite: FileSqlite | undefined;
let cloudflareEnv: CloudflareEnv | undefined;
let envResolved = false;
let schemaReady = false;
let schemaPromise: Promise<void> | undefined;
const afterInit: Array<() => Promise<void>> = [];

export function afterDatabaseInit(fn: () => Promise<void>) {
  afterInit.push(fn);
}

export function bindCloudflareEnv(env: unknown) {
  if (!env || typeof env !== "object") {
    return;
  }

  cloudflareEnv = env as CloudflareEnv;
  envResolved = true;
}

export async function getCloudflareEnv(): Promise<CloudflareEnv | undefined> {
  if (envResolved) {
    return cloudflareEnv;
  }

  envResolved = true;
  try {
    const spec = "cloudflare" + ":workers";
    const mod = (await import(/* @vite-ignore */ spec)) as { env?: CloudflareEnv };
    cloudflareEnv = mod.env;
  } catch {
    cloudflareEnv = undefined;
  }

  return cloudflareEnv;
}

async function getD1(): Promise<D1DatabaseBinding | undefined> {
  const env = await getCloudflareEnv();
  const db = env?.DB;
  if (db && typeof db.prepare === "function") {
    return db;
  }
  return undefined;
}

async function openSqlite(): Promise<FileSqlite> {
  if (sqlite) {
    return sqlite;
  }

  const { openFileSqlite } = await import("./sqlite.server");
  sqlite = openFileSqlite();
  return sqlite;
}

function isCloudflareWorkers(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

export async function ensureDatabase() {
  if (schemaReady) {
    return;
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      const d1 = await getD1();
      if (d1) {
        await d1.exec(`PRAGMA foreign_keys = ON;${SCHEMA}`);
      } else if (isCloudflareWorkers()) {
        throw new Error(
          "D1 database binding DB is missing. In Cloudflare, add a D1 binding named DB to the simba-site Worker.",
        );
      } else {
        (await openSqlite()).exec(SCHEMA);
      }

      schemaReady = true;
      for (const fn of afterInit) {
        await fn();
      }
    })().catch((error) => {
      schemaReady = false;
      schemaPromise = undefined;
      throw error;
    });
  }

  await schemaPromise;
}

export async function sqlGet<T>(query: string, ...params: SqlValue[]): Promise<T | undefined> {
  await ensureDatabase();
  const d1 = await getD1();
  if (d1) {
    const row = await d1.prepare(query).bind(...params).first<T>();
    return row ?? undefined;
  }

  return (await openSqlite()).prepare(query).get(...params) as T | undefined;
}

export async function sqlAll<T>(query: string, ...params: SqlValue[]): Promise<T[]> {
  await ensureDatabase();
  const d1 = await getD1();
  if (d1) {
    const result = await d1.prepare(query).bind(...params).all<T>();
    return result.results ?? [];
  }

  return (await openSqlite()).prepare(query).all(...params) as T[];
}

export async function sqlRun(query: string, ...params: SqlValue[]): Promise<{ changes: number }> {
  await ensureDatabase();
  const d1 = await getD1();
  if (d1) {
    const result = await d1.prepare(query).bind(...params).run();
    return { changes: result.meta?.changes ?? 0 };
  }

  const result = (await openSqlite()).prepare(query).run(...params);
  return { changes: Number(result.changes ?? 0) };
}
