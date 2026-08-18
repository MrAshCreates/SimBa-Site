import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

import type { InterpreterResult, SimbaRunMode } from "./simba.server";

const RUN_TIMEOUT_MS = 90_000;

function resolveSimbaBinary(): string | null {
  const candidates = [
    path.join(process.cwd(), "simba_interpreter", "target", "release", "simba"),
    path.join(process.cwd(), "simba_interpreter", "target", "debug", "simba"),
    path.join(process.cwd(), "simba_interpreter", "target", "release", "simba.exe"),
    path.join(process.cwd(), "simba_interpreter", "target", "debug", "simba.exe"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function runSimbaSourceLocal(code: string, resolvedMode: SimbaRunMode): Promise<InterpreterResult> {
  const binary = resolveSimbaBinary();
  if (!binary) {
    return {
      status: "error",
      stdout: "",
      stderr: "SimBa interpreter not found. Build it with `cargo build --release` inside the simba_interpreter folder.",
      output: "",
      mode: resolvedMode,
    };
  }

  const tempDir = await mkdtemp(path.join(tmpdir(), "simba-run-"));
  const scriptPath = path.join(tempDir, "program.smba");

  try {
    await writeFile(scriptPath, code, "utf8");
    const args =
      resolvedMode === "compile"
        ? ["compile", scriptPath]
        : resolvedMode === "debug"
          ? ["run", scriptPath, "--debug"]
          : ["run", scriptPath];
    const result = await spawnSimba(binary, args);

    return {
      status: result.exitCode === 0 ? "success" : "error",
      stdout: result.stdout,
      stderr: result.stderr,
      output: result.stdout,
      mode: resolvedMode,
    };
  } catch (error) {
    return {
      status: "error",
      stdout: "",
      stderr: error instanceof Error ? error.message : "Failed to run SimBa.",
      output: "",
      mode: resolvedMode,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function spawnSimba(binary: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const extraPath = [path.join(homedir(), ".cargo", "bin"), "/opt/homebrew/bin", "/usr/local/bin"].join(path.delimiter);
    const child = spawn(binary, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PATH: `${extraPath}${path.delimiter}${process.env.PATH ?? ""}`,
      },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        child.kill("SIGKILL");
        settled = true;
        resolve({
          stdout,
          stderr: stderr ? `${stderr}\nExecution timed out.` : "Execution timed out.",
          exitCode: 1,
        });
      }
    }, RUN_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
  });
}
