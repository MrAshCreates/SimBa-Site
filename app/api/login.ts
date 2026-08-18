import type { Route } from "./+types/login";
import { authenticateUser, startSession } from "~/data/auth.server";
import { isSameOriginRequest, jsonError, readJsonBody } from "~/lib/request-security.server";
import { sessionCookieHeader } from "~/lib/session.server";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return jsonError("Method not allowed.", 405);
  }

  if (!isSameOriginRequest(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  try {
    const body = await readJsonBody<LoginBody>(request);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return jsonError("Email and password are required.", 400);
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const sessionId = await startSession(user.id);
    return Response.json(
      { user },
      {
        headers: {
          "Set-Cookie": sessionCookieHeader(sessionId, request),
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "payload-too-large") {
      return jsonError("Request is too large.", 413);
    }
    console.error("login failed", error);
    return jsonError("Unable to log in. Please try again.", 500);
  }
}
