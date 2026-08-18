import type { Route } from "./+types/files-item";
import { deleteFile, updateFile } from "~/data/files.server";
import { isSameOriginRequest, jsonError, readJsonBody } from "~/lib/request-security.server";
import { getUserFromRequest } from "~/lib/session.server";

export async function action({ request, params }: Route.ActionArgs) {
  if (!isSameOriginRequest(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return jsonError("You need to be signed in.", 401);
  }

  const fileId = params.fileId;
  if (!fileId) {
    return jsonError("Missing file id.", 400);
  }

  if (request.method === "DELETE") {
    const deleted = await deleteFile(user.id, fileId);
    if (!deleted) {
      return jsonError("File not found.", 404);
    }
    return Response.json({ ok: true });
  }

  if (request.method === "PATCH") {
    try {
      const body = await readJsonBody<{ name?: unknown; content?: unknown }>(request, 256 * 1024);
      const file = await updateFile(user.id, fileId, {
        name: typeof body?.name === "string" ? body.name : undefined,
        content: typeof body?.content === "string" ? body.content : undefined,
      });
      if (!file) {
        return jsonError("File not found.", 404);
      }
      return Response.json({ file });
    } catch (error) {
      if (error instanceof Error && error.message === "payload-too-large") {
        return jsonError("Request is too large.", 413);
      }
      return jsonError("Unable to update file.", 500);
    }
  }

  return jsonError("Method not allowed.", 405);
}
