import type { Route } from "./+types/files";
import { createFile, listFiles, ensureDefaultFile } from "~/data/files.server";
import { isSameOriginRequest, jsonError, readJsonBody } from "~/lib/request-security.server";
import { getUserFromRequest } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return jsonError("You need to be signed in.", 401);
  }

  await ensureDefaultFile(user.id);
  return Response.json({ files: await listFiles(user.id) });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return jsonError("Method not allowed.", 405);
  }

  if (!isSameOriginRequest(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return jsonError("You need to be signed in.", 401);
  }

  try {
    const body = await readJsonBody<{ name?: unknown; content?: unknown }>(request, 256 * 1024);
    const name = typeof body?.name === "string" ? body.name : "untitled.smba";
    const content = typeof body?.content === "string" ? body.content : undefined;
    const file = await createFile(user.id, name, content);
    return Response.json({ file });
  } catch (error) {
    if (error instanceof Error && error.message === "payload-too-large") {
      return jsonError("Request is too large.", 413);
    }
    return jsonError("Unable to create file.", 500);
  }
}
