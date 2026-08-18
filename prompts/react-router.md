# React Router Examples

## Simple routing example

```tsx
// sample route config
import { type RouteConfig, route, index, layout, prefix } from "@react-router/dev/routes";

export default [
  index("./home.tsx"),
  route("about", "./about.tsx"),

  layout("./auth/layout.tsx", [route("login", "./auth/login.tsx"), route("register", "./auth/register.tsx")]),

  ...prefix("concerts", [
    index("./concerts/home.tsx"),
    route(":city", "./concerts/city.tsx"),
    route("trending", "./concerts/trending.tsx"),
  ]),
] satisfies RouteConfig;
```

## Sample route module with loader

```tsx
import type { Route } from "./+types/team";
export async function loader({ params }: Route.LoaderArgs) {
  let team = await fetchTeam(params.teamId);
  return { name: team.name };
}
export default function Component({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.name}</h1>;
}
```

## nested routes via <Outlet/>

```tsx
import { Outlet } from "react-router";
export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Outlet />
    </div>
  );
}
```

## Links and Navigation

```tsx
import { Link } from "react-router";

// For internal site links, rather than using anchor elements (<a />), use the Link component
<Link to="/dashboard">Dashboard</Link>;

<Link
  to={{
    pathname: "/some/path",
    search: "?query=string",
    hash: "#hash",
  }}
/>;
```

IMPORTANT: use NavLink to create links that can be styled based on whether they are active or not.

```tsx
import { NavLink } from "react-router";

<NavLink to="/messages" className={({ isActive, isPending }) => (isPending ? "pending" : isActive ? "active" : "")}>
  Messages
</NavLink>;
```

## Forms and Actions

```tsx
import { Form, useActionData } from "react-router";

export async function action({ request }) {
  const body = await request.formData();
  const name = body.get("visitorsName");
  return { message: `Hello, ${name}` };
}

export default function Invoices() {
  const data = useActionData();
  return (
    <Form method="post">
      <input type="text" name="visitorsName" />
      {data ? data.message : "Waiting..."}
    </Form>
  );
}
```
