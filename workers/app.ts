import { createRequestHandler, type ServerBuild } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build") as Promise<ServerBuild>,
  import.meta.env.MODE,
);

export default {
  fetch(request: Request) {
    return requestHandler(request);
  },
};
