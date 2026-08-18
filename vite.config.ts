import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const ssrExternals = ["node:sqlite", "cloudflare:workers"];

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  ssr: {
    external: ssrExternals,
  },
  build: {
    rollupOptions: {
      external: ssrExternals,
    },
  },
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          external: ssrExternals,
        },
      },
    },
  },
});
