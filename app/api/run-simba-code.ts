import type { Route } from "./+types/run-simba-code";
import { runSimbaSource, type SimbaRunMode } from "~/lib/simba.server";
import { isSameOriginRequest, jsonError, readJsonBody } from "~/lib/request-security.server";
import { getUserFromRequest } from "~/lib/session.server";

const MAX_CODE_LENGTH = 50_000;

interface RunCodeBody {
  code?: unknown;
  debug?: unknown;
  mode?: unknown;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return jsonError("Method not allowed.", 405);
  }

  if (!isSameOriginRequest(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  if (!(await getUserFromRequest(request))) {
    return jsonError("You need to be signed in.", 401);
  }

  try {
    const body = await readJsonBody<RunCodeBody>(request, 256 * 1024);
    const code = typeof body?.code === "string" ? body.code : "";
    const mode: SimbaRunMode =
      body?.mode === "compile" || body?.mode === "debug" || body?.mode === "run"
        ? body.mode
        : body?.debug === true
          ? "debug"
          : "run";

    if (!code.trim()) {
      return Response.json({
        status: "error",
        stdout: "",
        stderr: "Code editor is empty, nothing to run.",
        output: "",
        mode,
      });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return Response.json({
        status: "error",
        stdout: "",
        stderr: "Code is too large to execute.",
        output: "",
        mode,
      });
    }

    const result = await runSimbaSource(code, mode);
    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "payload-too-large") {
      return jsonError("Request is too large.", 413);
    }

    return Response.json({
      status: "error",
      stdout: "",
      stderr: "Unable to run code. Please try again.",
      output: "",
      mode: "run",
    });
  }
}
