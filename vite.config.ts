import path from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const root = path.dirname(fileURLToPath(import.meta.url));

function stubNodeOnlyModules(useCloudflare: boolean): Plugin {
  const stubs: Record<string, string> = {
    "sqlite.server": path.join(root, "app/lib/sqlite.stub.server.ts"),
    "simba-local.server": path.join(root, "app/lib/simba-local.stub.server.ts"),
  };

  return {
    name: "stub-node-only-modules",
    enforce: "pre",
    resolveId(source) {
      if (!useCloudflare) {
        return null;
      }

      for (const [name, stub] of Object.entries(stubs)) {
        if (source === `./${name}` || source.endsWith(`/${name}`) || source.endsWith(`${name}.ts`)) {
          return stub;
        }
      }

      return null;
    },
  };
}

export default defineConfig(({ command }) => {
  const useCloudflare = command === "build" || process.env.CI === "true" || Boolean(process.env.WORKERS_CI);

  return {
    plugins: [
      ...(useCloudflare ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
      stubNodeOnlyModules(useCloudflare),
      reactRouter(),
      tsconfigPaths(),
    ],
    ...(!useCloudflare
      ? {
          ssr: {
            external: ["node:sqlite", "cloudflare:workers"],
          },
        }
      : {}),
  };
});
