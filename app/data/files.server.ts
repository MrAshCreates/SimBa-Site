import { sqlAll, sqlGet, sqlRun } from "~/lib/db.server";

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

export async function listFiles(userId: string): Promise<UserFile[]> {
  const rows = await sqlAll<FileRow>("SELECT * FROM files WHERE user_id = ? ORDER BY updated_at DESC", userId);
  return rows.map(mapFile);
}

export async function getFile(userId: string, fileId: string): Promise<UserFile | null> {
  const row = await sqlGet<FileRow>("SELECT * FROM files WHERE id = ? AND user_id = ?", fileId, userId);
  return row ? mapFile(row) : null;
}

export async function ensureDefaultFile(userId: string): Promise<UserFile> {
  const existing = await listFiles(userId);
  if (existing.length > 0) {
    return existing[0];
  }

  return createFile(userId, "main.smba", DEFAULT_MAIN_SMBA);
}

export async function uniqueFileName(userId: string, desiredName: string): Promise<string> {
  const base = sanitizeFileName(desiredName) ?? "untitled.smba";
  const names = new Set((await sqlAll<{ name: string }>("SELECT name FROM files WHERE user_id = ?", userId)).map((row) => row.name));

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

export async function createFile(userId: string, name: string, content = DEFAULT_MAIN_SMBA): Promise<UserFile> {
  const fileName = await uniqueFileName(userId, name);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await sqlRun(
    "INSERT INTO files (id, user_id, name, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    id,
    userId,
    fileName,
    content,
    now,
    now,
  );

  return {
    id,
    userId,
    name: fileName,
    content,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

export async function updateFile(
  userId: string,
  fileId: string,
  updates: { name?: string; content?: string },
): Promise<UserFile | null> {
  const current = await getFile(userId, fileId);
  if (!current) {
    return null;
  }

  let nextName = current.name;
  if (updates.name) {
    const sanitized = sanitizeFileName(updates.name);
    if (!sanitized) {
      return null;
    }
    nextName = sanitized === current.name ? current.name : await uniqueFileName(userId, sanitized);
  }

  const nextContent = updates.content ?? current.content;
  const now = new Date().toISOString();
  await sqlRun(
    "UPDATE files SET name = ?, content = ?, updated_at = ? WHERE id = ? AND user_id = ?",
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

export async function deleteFile(userId: string, fileId: string): Promise<boolean> {
  const result = await sqlRun("DELETE FROM files WHERE id = ? AND user_id = ?", fileId, userId);
  return result.changes > 0;
}
