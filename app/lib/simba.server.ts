export type SimbaRunMode = "compile" | "run" | "debug";

export interface InterpreterResult {
  status: "success" | "error";
  stdout: string;
  stderr: string;
  output: string;
  mode: SimbaRunMode;
}

function isCloudflareWorkers(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

export async function runSimbaSource(code: string, mode: SimbaRunMode | boolean = "run"): Promise<InterpreterResult> {
  const resolvedMode: SimbaRunMode = mode === true ? "debug" : mode === false ? "run" : mode;
  if (isCloudflareWorkers()) {
    return {
      status: "error",
      stdout: "",
      stderr:
        "The SimBa interpreter cannot run on Cloudflare Workers (no local filesystem or process spawn). Use `npm run dev` on your machine to execute programs.",
      output: "",
      mode: resolvedMode,
    };
  }

  const { runSimbaSourceLocal } = await import("./simba-local.server");
  return runSimbaSourceLocal(code, resolvedMode);
}
