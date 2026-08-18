import { sqlGet, sqlRun } from "./db.server";

const SESSION_COOKIE = "simba_session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 25_000;

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

export interface UserRow {
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

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function derivePbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: Uint8Array.from(salt), iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePbkdf2(password, salt);
  return `pbkdf2:${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("pbkdf2:")) {
    const [, saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) {
      return false;
    }

    const actual = fromHex(hashHex);
    const test = await derivePbkdf2(password, fromHex(saltHex));
    return timingSafeEqualBytes(actual, test);
  }

  try {
    const { scryptSync, timingSafeEqual } = await import("node:crypto");
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
  } catch {
    return false;
  }
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

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  return sqlGet<UserRow>("SELECT * FROM users WHERE email = ?", email.toLowerCase());
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  return sqlGet<UserRow>("SELECT * FROM users WHERE id = ?", id);
}

export async function createSession(userId: string): Promise<string> {
  const id = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await sqlRun("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", id, userId, expiresAt);
  return id;
}

export async function deleteSession(sessionId: string) {
  await sqlRun("DELETE FROM sessions WHERE id = ?", sessionId);
}

export async function getUserFromRequest(request: Request): Promise<SessionUser | null> {
  const sessionId = readCookie(request, SESSION_COOKIE);
  if (!sessionId) {
    return null;
  }

  const session = await sqlGet<{ user_id: string; expires_at: string }>(
    "SELECT user_id, expires_at FROM sessions WHERE id = ?",
    sessionId,
  );

  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await deleteSession(sessionId);
    return null;
  }

  const user = await getUserById(session.user_id);
  return user ? mapUser(user) : null;
}

export function sessionCookieHeader(sessionId: string, request?: Request): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const secure = request && new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookieHeader(request?: Request): string {
  const secure = request && new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
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
