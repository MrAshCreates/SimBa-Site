import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),
  route("about", "./routes/about.tsx"),
  route("guide", "./routes/guide.tsx"),
  route("login", "./routes/login.tsx"),
  route("signup", "./routes/signup.tsx"),
  route("playground", "./routes/playground.tsx"),
  route("settings", "./routes/settings.tsx"),
  route("api/run-simba-code", "./api/run-simba-code.ts"),
] satisfies RouteConfig;
