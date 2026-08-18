import type { InterpreterResult, SimbaRunMode } from "./simba.server";

export async function runSimbaSourceLocal(_code: string, resolvedMode: SimbaRunMode): Promise<InterpreterResult> {
  return {
    status: "error",
    stdout: "",
    stderr:
      "The SimBa interpreter is unavailable in this environment.",
    output: "",
    mode: resolvedMode,
  };
}
