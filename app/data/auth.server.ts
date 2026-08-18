import { getDb } from "~/lib/db.server";
import {
  createSession,
  getUserByEmail,
  hashPassword,
  mapUser,
  type SessionUser,
  verifyPassword,
} from "~/lib/session.server";
import { ensureDefaultFile, DEFAULT_MAIN_SMBA } from "~/data/files.server";

const OWNER_EMAIL = "mrashcreates@gmail.com";
const DEMO_EMAIL = "demo@simba.dev";
const DEMO_PASSWORD = "demo123";

function seedUsers() {
  const db = getDb();

  const demo = getUserByEmail(DEMO_EMAIL);
  if (!demo) {
    const demoId = "demo";
    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, is_owner, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
    ).run(demoId, "demo", DEMO_EMAIL, hashPassword(DEMO_PASSWORD), new Date("2024-01-01").toISOString());
    db.prepare(
      `INSERT INTO files (id, user_id, name, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run("demo-main", demoId, "main.smba", DEFAULT_MAIN_SMBA, new Date().toISOString(), new Date().toISOString());
  }

  const ownerPassword = process.env.SIMBA_OWNER_PASSWORD;
  const owner = getUserByEmail(OWNER_EMAIL);
  if (typeof ownerPassword === "string" && ownerPassword.length > 0) {
    const passwordHash = hashPassword(ownerPassword);
    if (!owner) {
      const ownerId = "owner";
      db.prepare(
        `INSERT INTO users (id, username, email, password_hash, is_owner, created_at)
         VALUES (?, ?, ?, ?, 1, ?)`,
      ).run(ownerId, "MrAshCreates", OWNER_EMAIL, passwordHash, new Date("2024-01-01").toISOString());
      db.prepare(
        `INSERT INTO files (id, user_id, name, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run("owner-main", ownerId, "main.smba", DEFAULT_MAIN_SMBA, new Date().toISOString(), new Date().toISOString());
    } else {
      db.prepare("UPDATE users SET password_hash = ?, is_owner = 1 WHERE id = ?").run(passwordHash, owner.id);
    }
  }
}

seedUsers();

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const row = getUserByEmail(email.trim().toLowerCase());
  if (!row || !verifyPassword(password, row.password_hash)) {
    return null;
  }

  return mapUser(row);
}

export async function createUser(
  username: string,
  email: string,
  password: string,
  phone?: string,
): Promise<SessionUser | null> {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
    .get(normalizedEmail, username) as unknown as { id: string } | undefined;

  if (existing) {
    return null;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, username, email, password_hash, phone, is_owner, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
  ).run(id, username, normalizedEmail, hashPassword(password), phone ?? null, createdAt);

  const user = mapUser({
    id,
    username,
    email: normalizedEmail,
    password_hash: "",
    phone: phone ?? null,
    developer_status: null,
    simba_usage: null,
    is_owner: 0,
    created_at: createdAt,
  });

  ensureDefaultFile(user.id);
  return user;
}

export async function updateUserProfile(
  userId: string,
  updates: { developerStatus?: string; simbaUsage?: string; phone?: string },
): Promise<SessionUser | null> {
  const db = getDb();
  const current = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as unknown as
    | {
        id: string;
        username: string;
        email: string;
        password_hash: string;
        phone: string | null;
        developer_status: string | null;
        simba_usage: string | null;
        is_owner: number;
        created_at: string;
      }
    | undefined;

  if (!current) {
    return null;
  }

  const phone = updates.phone ?? current.phone;
  const developerStatus = updates.developerStatus ?? current.developer_status;
  const simbaUsage = updates.simbaUsage ?? current.simba_usage;

  db.prepare("UPDATE users SET phone = ?, developer_status = ?, simba_usage = ? WHERE id = ?").run(
    phone,
    developerStatus,
    simbaUsage,
    userId,
  );

  return mapUser({
    ...current,
    phone,
    developer_status: developerStatus,
    simba_usage: simbaUsage,
  });
}

export function startSession(userId: string): string {
  return createSession(userId);
}
