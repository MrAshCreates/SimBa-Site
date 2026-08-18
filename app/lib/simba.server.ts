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
    const { runSimbaWasm } = await import("./simba-wasm.server");
    return runSimbaWasm(code, resolvedMode);
  }

  const { runSimbaSourceLocal } = await import("./simba-local.server");
  return runSimbaSourceLocal(code, resolvedMode);
}
