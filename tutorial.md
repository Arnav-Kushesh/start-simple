# Tutorial — Start Simple

A step-by-step guide to building routes with SSR and SSG using Start Simple.

---

## Prerequisites

- Node.js 18+ installed
- Basic knowledge of React and Express

---

## 1. Create a New Project

```bash
npx start-simple my-app
cd my-app
npm install
```

---

## 2. Start the Dev Server

```bash
npm run dev
```

Open `http://localhost:5173`. You should see the home page with navigation links.

---

## 3. Add a New SSG Page

Let's add a `/contact` page that is statically generated.

### Step 3a: Create the page component

Create `packages/frontend/src/pages/Contact.jsx`:

```jsx
import { useLoaderData } from "../context/LoaderDataContext";
import { Link } from "react-router-dom";

export default function Contact() {
  const data = useLoaderData();

  return (
    <div className="page">
      <h1>{data?.title || "Contact"}</h1>
      <p>Email: {data?.email}</p>
      <Link to="/">← Back to Home</Link>
    </div>
  );
}
```

### Step 3b: Register the route in `router.jsx`

Open `packages/frontend/src/router.jsx` and add:

```diff
 import Home from "./pages/Home";
 import About from "./pages/About";
 import Post from "./pages/Post";
+import Contact from "./pages/Contact";

 const routes = [
   { path: "/", element: <Home /> },
   { path: "/about", element: <About /> },
   { path: "/post/:id", element: <Post /> },
+  { path: "/contact", element: <Contact /> },
 ];
```

### Step 3c: Add the SSG route config

Open `packages/frontend/renderingConfig.js` and add to `ssgRoutes`:

```diff
 export const ssgRoutes = [
   {
     path: "/",
     loader: async () => ({ title: "Welcome to Start Simple", description: "..." }),
   },
   {
     path: "/about",
     loader: async () => ({ title: "About Start Simple", mission: "..." }),
   },
+  {
+    path: "/contact",
+    loader: async () => ({
+      title: "Contact Us",
+      email: "hello@example.com",
+    }),
+  },
 ];
```

### Step 3d: Test it

```bash
npm run optimized-frontend-dev
```

Visit `http://localhost:5173/contact`. View the page source — the HTML should include the title and email, proving it was server-rendered.

---

## 4. Add a New SSR Page

Let's add a `/user/:username` page that fetches fresh data on every request.

### Step 4a: Create the page component

Create `packages/frontend/src/pages/User.jsx`:

```jsx
import { useLoaderData } from "../context/LoaderDataContext";
import { Link } from "react-router-dom";

export default function User() {
  const data = useLoaderData();

  if (!data) return <p>Loading...</p>;

  return (
    <div className="page">
      <Link to="/">← Home</Link>
      <h1>{data.name}</h1>
      <p>Email: {data.email}</p>
      <p>Company: {data.company?.name}</p>
    </div>
  );
}
```

### Step 4b: Register in `router.jsx`

```diff
+import User from "./pages/User";

 const routes = [
   // ...existing routes...
+  { path: "/user/:username", element: <User /> },
 ];
```

### Step 4c: Add the SSR route config

In `renderingConfig.js`, add to `ssrRoutes`:

```diff
 export const ssrRoutes = [
   {
     path: "/post/:id",
     loader: async ({ params }) => { ... },
   },
+  {
+    path: "/user/:username",
+    loader: async ({ params }) => {
+      const res = await fetch(
+        `https://jsonplaceholder.typicode.com/users?username=${params.username}`
+      );
+      const users = await res.json();
+      if (users.length === 0) throw new Error("User not found");
+      return users[0];
+    },
+  },
 ];
```

### Step 4d: Test it

```bash
npm run optimized-frontend-dev
```

Visit `http://localhost:5173/user/Bret`. The user data should be visible in the page source.

---

## 5. Build for Production

```bash
# Build client & server bundles, then pre-render SSG routes
npm run build

# Start the production server
npm run optimized-frontend-prod
```

Visit `http://localhost:5173`:
- SSG routes (home, about, contact) → served from pre-built HTML files
- SSR routes (post, user) → rendered on every request with fresh data

---

## 6. Using Query Parameters in Loaders

Loaders receive `query` as the second parameter property:

```js
{
  path: "/search",
  loader: async ({ query }) => {
    const res = await fetch(`https://api.example.com/search?q=${query.q}`);
    return res.json();
  },
}
```

Visit `/search?q=hello` and the loader will have `query.q === "hello"`.

---

## Summary

| What you want | Where to configure |
| --- | --- |
| Add a new page component | `src/pages/YourPage.jsx` |
| Register the route | `src/router.jsx` |
| Make it SSG with data | Add to `ssgRoutes` in `renderingConfig.js` |
| Make it SSR with data | Add to `ssrRoutes` in `renderingConfig.js` |
| Access loader data | `useLoaderData()` hook |
