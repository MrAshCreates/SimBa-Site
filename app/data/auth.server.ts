import { afterDatabaseInit, getCloudflareEnv, sqlGet, sqlRun } from "~/lib/db.server";
import {
  createSession,
  getUserByEmail,
  hashPassword,
  mapUser,
  type SessionUser,
  type UserRow,
  verifyPassword,
} from "~/lib/session.server";
import { ensureDefaultFile, DEFAULT_MAIN_SMBA } from "~/data/files.server";

const OWNER_EMAIL = "mrashcreates@gmail.com";
const DEMO_EMAIL = "demo@simba.dev";
const DEMO_PASSWORD = "demo123";

async function seedUsers() {
  const demo = await getUserByEmail(DEMO_EMAIL);
  if (!demo) {
    const demoId = "demo";
    await sqlRun(
      `INSERT INTO users (id, username, email, password_hash, is_owner, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
      demoId,
      "demo",
      DEMO_EMAIL,
      await hashPassword(DEMO_PASSWORD),
      new Date("2024-01-01").toISOString(),
    );
    await sqlRun(
      `INSERT INTO files (id, user_id, name, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      "demo-main",
      demoId,
      "main.smba",
      DEFAULT_MAIN_SMBA,
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  const env = await getCloudflareEnv();
  const ownerPassword = env?.SIMBA_OWNER_PASSWORD ?? process.env.SIMBA_OWNER_PASSWORD;
  const owner = await getUserByEmail(OWNER_EMAIL);
  if (typeof ownerPassword === "string" && ownerPassword.length > 0) {
    const passwordHash = await hashPassword(ownerPassword);
    if (!owner) {
      const ownerId = "owner";
      await sqlRun(
        `INSERT INTO users (id, username, email, password_hash, is_owner, created_at)
         VALUES (?, ?, ?, ?, 1, ?)`,
        ownerId,
        "MrAshCreates",
        OWNER_EMAIL,
        passwordHash,
        new Date("2024-01-01").toISOString(),
      );
      await sqlRun(
        `INSERT INTO files (id, user_id, name, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        "owner-main",
        ownerId,
        "main.smba",
        DEFAULT_MAIN_SMBA,
        new Date().toISOString(),
        new Date().toISOString(),
      );
    } else {
      await sqlRun("UPDATE users SET password_hash = ?, is_owner = 1 WHERE id = ?", passwordHash, owner.id);
    }
  }
}

afterDatabaseInit(seedUsers);

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const row = await getUserByEmail(email.trim().toLowerCase());
  if (!row || !(await verifyPassword(password, row.password_hash))) {
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
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await sqlGet<{ id: string }>(
    "SELECT id FROM users WHERE email = ? OR username = ?",
    normalizedEmail,
    username,
  );

  if (existing) {
    return null;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await sqlRun(
    `INSERT INTO users (id, username, email, password_hash, phone, is_owner, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    id,
    username,
    normalizedEmail,
    await hashPassword(password),
    phone ?? null,
    createdAt,
  );

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

  await ensureDefaultFile(user.id);
  return user;
}

export async function updateUserProfile(
  userId: string,
  updates: { developerStatus?: string; simbaUsage?: string; phone?: string },
): Promise<SessionUser | null> {
  const current = await sqlGet<UserRow>("SELECT * FROM users WHERE id = ?", userId);

  if (!current) {
    return null;
  }

  const phone = updates.phone ?? current.phone;
  const developerStatus = updates.developerStatus ?? current.developer_status;
  const simbaUsage = updates.simbaUsage ?? current.simba_usage;

  await sqlRun("UPDATE users SET phone = ?, developer_status = ?, simba_usage = ? WHERE id = ?", phone, developerStatus, simbaUsage, userId);

  return mapUser({
    ...current,
    phone,
    developer_status: developerStatus,
    simba_usage: simbaUsage,
  });
}

export async function startSession(userId: string): Promise<string> {
  return createSession(userId);
}
