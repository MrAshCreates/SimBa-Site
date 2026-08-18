import { spawn } from "node:child_process";

const isWorkersCi = process.env.CI === "true" || process.env.WORKERS_CI === "1";

if (isWorkersCi) {
  console.log("Workers Builds should use `npm run build`. Running the production build instead of the dev server.");
}

const child = spawn(
  "npm",
  isWorkersCi ? ["run", "build"] : ["exec", "react-router", "dev", ...process.argv.slice(2)],
  { stdio: "inherit", shell: process.platform === "win32" },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
