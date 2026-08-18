import { createRequestHandler, type ServerBuild } from "react-router";

type CloudflareEnv = {
  DB?: unknown;
  SIMBA_OWNER_PASSWORD?: string;
};

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build") as Promise<ServerBuild>,
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, env: CloudflareEnv) {
    const { bindCloudflareEnv } = await import("../app/lib/db.server");
    bindCloudflareEnv(env);
    return requestHandler(request);
  },
};
