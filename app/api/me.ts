import type { Route } from "./+types/me";
import { updateUserProfile } from "~/data/auth.server";
import { isSameOriginRequest, jsonError, readJsonBody } from "~/lib/request-security.server";
import { getUserFromRequest } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({ user });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "PATCH") {
    return jsonError("Method not allowed.", 405);
  }

  if (!isSameOriginRequest(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return jsonError("You need to be signed in.", 401);
  }

  const body = await readJsonBody<{ phone?: unknown; developerStatus?: unknown; simbaUsage?: unknown }>(request);
  const updated = await updateUserProfile(user.id, {
    phone: typeof body?.phone === "string" ? body.phone : undefined,
    developerStatus: typeof body?.developerStatus === "string" ? body.developerStatus : undefined,
    simbaUsage: typeof body?.simbaUsage === "string" ? body.simbaUsage : undefined,
  });

  return Response.json({ user: updated });
}
