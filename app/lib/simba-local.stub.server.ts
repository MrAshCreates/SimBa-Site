import type { InterpreterResult, SimbaRunMode } from "./simba.server";

export async function runSimbaSourceLocal(_code: string, resolvedMode: SimbaRunMode): Promise<InterpreterResult> {
  return {
    status: "error",
    stdout: "",
    stderr:
      "The SimBa interpreter cannot run on Cloudflare Workers (no local filesystem or process spawn). Use `npm run dev` on your machine to execute programs.",
    output: "",
    mode: resolvedMode,
  };
}
