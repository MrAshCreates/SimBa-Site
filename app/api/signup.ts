import type { Route } from "./+types/signup";
import { createUser, startSession } from "~/data/auth.server";
import { isSameOriginRequest, jsonError, readJsonBody } from "~/lib/request-security.server";
import { sessionCookieHeader } from "~/lib/session.server";

interface SignupBody {
  username?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return jsonError("Method not allowed.", 405);
  }

  if (!isSameOriginRequest(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  try {
    const body = await readJsonBody<SignupBody>(request);
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    if (username.length < 3 || username.length > 64) {
      return jsonError("Username must be between 3 and 64 characters.", 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return jsonError("Please enter a valid email address.", 400);
    }

    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters.", 400);
    }

    const user = await createUser(username, email, password, phone || undefined);
    if (!user) {
      return jsonError("Username or email already exists.", 409);
    }

    const sessionId = startSession(user.id);
    return Response.json(
      { user },
      {
        headers: {
          "Set-Cookie": sessionCookieHeader(sessionId),
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "payload-too-large") {
      return jsonError("Request is too large.", 413);
    }
    return jsonError("Unable to create an account. Please try again.", 500);
  }
}
