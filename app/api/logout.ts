import type { Route } from "./+types/logout";
import { isSameOriginRequest, jsonError } from "~/lib/request-security.server";
import { clearSessionCookieHeader, deleteSession, readSessionId } from "~/lib/session.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return jsonError("Method not allowed.", 405);
  }

  if (!isSameOriginRequest(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const sessionId = readSessionId(request);
  if (sessionId) {
    deleteSession(sessionId);
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookieHeader(),
      },
    },
  );
}
