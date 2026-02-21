# Documentation Reference

This document provides a detailed API reference for the Start Simple JS frontend architecture.

## `renderingConfig.js`
The heart of the SSR/SSG engine. This file defines which pages are statically generated at build-time (SSG) and which are rendered on the server dynamically during runtime (SSR).

Any route *not* listed in this file will default to an SSG route with no `loader`.

### Example Format
```js
export const ssgRoutes = [
  {
    path: "/about",
    loader: async ({ params, query }) => {
      return { title: "About Us" };
    },
  },
];

export const ssrRoutes = [
  {
    path: "/post/:id",
    loader: async ({ params, query }) => {
      const res = await fetch(`https://api.example.com/posts/${params.id}`);
      return res.json();
    },
  },
];
```

### Route Types 
- `ssgRoutes`: Routes exported in this array will be processed by `prerender.js` during the build phase. The result is pure, static `.html` files output in the `dist/client/` directory.
- `ssrRoutes`: Routes exported here are ignored during build. Instead, when a request hits `server.js`, their loader executes in real-time, the React tree renders, and the full HTML is sent back.

### Loaders
Loaders run EXCLUSIVELY on the server (either during the Vite build phase for SSG, or inside the Express server for SSR). They receive an object with:
- `params`: Extracted path variables (e.g., `{ id: "1" }` for `/post/:id`).
- `query`: The URL query string parameters.

Returns JSON serializable data. **Do not return functions, classes, or cyclic structures.** This data is serialized and embedded into the HTML in a `<script>` tag during rendering.

## `LoaderDataContext`

This context provides access to the serialized data returned by your loaders inside your React components.

### `useLoaderData()` Hook
Call this hook from any component rendered within a route's view tree to access the data returned from that route's loader.

```jsx
import { useLoaderData } from "../context/LoaderDataContext";

export default function Post() {
  const data = useLoaderData();

  if (!data) return <p>Loading...</p>

  return <h1>{data.title}</h1>;
}
```

## `App` Layout Wrapper
To eliminate mismatched "dual React instances" caused by external libraries like modern Server-React-Routers, this architecture avoids native router wrapping.

Instead, the `App.jsx` simply acts as a standard component providing the application shell (e.g. Navigation Headers, Footers) and renders `children`. Both `entry-client.jsx` and `entry-server.jsx` wrap dynamic `<PageComponents />` in the `<App>` layout.

## Server (`server.js`)
The `server.js` acts as an Express adapter wrapping Vite. 

**Development Mode (`NODE_ENV=development`)**
- Instantiates Vite in middleware mode to provide flawless Hot Module Replacement (HMR).
- Runs SSR route mapping for all dynamic requests.

**Production Mode (`NODE_ENV=production`)**
- Serves SSG routes via `sirv` directly from the filesystem for blazing fast loads.
- Handles dynamic paths by rendering the output through the compiled React server-entry file and injecting loader payload JSON.
