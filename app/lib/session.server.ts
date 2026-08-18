import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "./db.server";

const SESSION_COOKIE = "simba_session";
const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  developerStatus?: string;
  simbaUsage?: string;
  createdAt: Date;
  isOwner?: boolean;
}

interface UserRow {
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

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    return false;
  }

  const actual = Buffer.from(hash, "hex");
  const test = scryptSync(password, salt, 64);
  if (actual.length !== test.length) {
    return false;
  }

  return timingSafeEqual(actual, test);
}

export function mapUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone ?? undefined,
    developerStatus: row.developer_status ?? undefined,
    simbaUsage: row.simba_usage ?? undefined,
    createdAt: new Date(row.created_at),
    isOwner: row.is_owner === 1,
  };
}

export function getUserByEmail(email: string): UserRow | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as unknown as UserRow | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as UserRow | undefined;
}

export function createSession(userId: string): string {
  const db = getDb();
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(id, userId, expiresAt);
  return id;
}

export function deleteSession(sessionId: string) {
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function getUserFromRequest(request: Request): SessionUser | null {
  const sessionId = readCookie(request, SESSION_COOKIE);
  if (!sessionId) {
    return null;
  }

  const db = getDb();
  const session = db.prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?").get(sessionId) as unknown as
    | { user_id: string; expires_at: string }
    | undefined;

  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    deleteSession(sessionId);
    return null;
  }

  const user = getUserById(session.user_id);
  return user ? mapUser(user) : null;
}

export function sessionCookieHeader(sessionId: string): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readSessionId(request: Request): string | null {
  return readCookie(request, SESSION_COOKIE);
}

function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return null;
  }

  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return rest.join("=");
    }
  }

  return null;
}
