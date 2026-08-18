import init, { execute } from "./simba-wasm/simba.js";
import wasmModule from "./simba-wasm/simba_bg.wasm";

import type { InterpreterResult, SimbaRunMode } from "./simba.server";

let wasmReady: Promise<void> | null = null;

async function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = init({ module_or_path: wasmModule }).then(() => undefined);
  }
  await wasmReady;
}

export async function runSimbaWasm(code: string, resolvedMode: SimbaRunMode): Promise<InterpreterResult> {
  await ensureWasm();
  const result = execute(code, resolvedMode);
  try {
    return {
      status: result.ok ? "success" : "error",
      stdout: result.stdout,
      stderr: result.stderr,
      output: result.stdout,
      mode: resolvedMode,
    };
  } finally {
    result.free();
  }
}
