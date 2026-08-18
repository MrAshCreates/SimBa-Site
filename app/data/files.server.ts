import { getDb } from "~/lib/db.server";

export interface UserFile {
  id: string;
  userId: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_MAIN_SMBA = `# SimBa writes like Python and can embed real Python and Rust.
def greet(name) {
    print("Hello, " + name + "! Welcome to SimBa!")
}

greet("Developer")

count = 42
print(count)

if count % 2 == 0 {
    print("even")
}
`;

interface FileRow {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function mapFile(row: FileRow): UserFile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    content: row.content,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function sanitizeFileName(name: string): string | null {
  const trimmed = name.trim().replaceAll("\\", "/").split("/").pop() ?? "";
  const safe = trimmed.replace(/[<>:"|?*\u0000-\u001F]/g, "").slice(0, 120);
  if (!safe) {
    return null;
  }

  return safe.includes(".") ? safe : `${safe}.smba`;
}

export function listFiles(userId: string): UserFile[] {
  const rows = getDb().prepare("SELECT * FROM files WHERE user_id = ? ORDER BY updated_at DESC").all(userId) as unknown as FileRow[];
  return rows.map(mapFile);
}

export function getFile(userId: string, fileId: string): UserFile | null {
  const row = getDb().prepare("SELECT * FROM files WHERE id = ? AND user_id = ?").get(fileId, userId) as unknown as FileRow | undefined;
  return row ? mapFile(row) : null;
}

export function ensureDefaultFile(userId: string): UserFile {
  const existing = listFiles(userId);
  if (existing.length > 0) {
    return existing[0];
  }

  return createFile(userId, "main.smba", DEFAULT_MAIN_SMBA);
}

export function uniqueFileName(userId: string, desiredName: string): string {
  const base = sanitizeFileName(desiredName) ?? "untitled.smba";
  const db = getDb();
  const names = new Set(
    (db.prepare("SELECT name FROM files WHERE user_id = ?").all(userId) as unknown as { name: string }[]).map((row) => row.name),
  );

  if (!names.has(base)) {
    return base;
  }

  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  let n = 2;
  while (names.has(`${stem}-${n}${ext}`)) {
    n += 1;
  }
  return `${stem}-${n}${ext}`;
}

export function createFile(userId: string, name: string, content = DEFAULT_MAIN_SMBA): UserFile {
  const fileName = uniqueFileName(userId, name);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  getDb()
    .prepare("INSERT INTO files (id, user_id, name, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, userId, fileName, content, now, now);

  return {
    id,
    userId,
    name: fileName,
    content,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

export function updateFile(
  userId: string,
  fileId: string,
  updates: { name?: string; content?: string },
): UserFile | null {
  const current = getFile(userId, fileId);
  if (!current) {
    return null;
  }

  let nextName = current.name;
  if (updates.name) {
    const sanitized = sanitizeFileName(updates.name);
    if (!sanitized) {
      return null;
    }
    nextName = sanitized === current.name ? current.name : uniqueFileName(userId, sanitized);
  }

  const nextContent = updates.content ?? current.content;
  const now = new Date().toISOString();
  getDb().prepare("UPDATE files SET name = ?, content = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(
    nextName,
    nextContent,
    now,
    fileId,
    userId,
  );

  return {
    ...current,
    name: nextName,
    content: nextContent,
    updatedAt: new Date(now),
  };
}

export function deleteFile(userId: string, fileId: string): boolean {
  const result = getDb().prepare("DELETE FROM files WHERE id = ? AND user_id = ?").run(fileId, userId);
  return result.changes > 0;
}
