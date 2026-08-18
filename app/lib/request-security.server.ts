const MAX_JSON_BYTES = 64 * 1024;

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readJsonBody<T>(request: Request, maxBytes = MAX_JSON_BYTES): Promise<T | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new Error("payload-too-large");
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
