# Documentation — Start Simple

Complete API reference for the Start Simple SSR/SSG framework.

---

## Table of Contents

- [renderingConfig.js](#renderingconfigjs)
- [Loader API](#loader-api)
- [LoaderDataContext](#loaderdatacontext)
- [Server Behavior](#server-behavior)
- [Build Pipeline](#build-pipeline)
- [Environment Variables](#environment-variables)

---

## renderingConfig.js

The central configuration file located at `packages/frontend/renderingConfig.js`. It exports two arrays:

### `ssgRoutes`

Routes that are **statically generated at build time**. The loader runs once during `npm run build`, and the resulting HTML is saved to `dist/client/`.

```js
export const ssgRoutes = [
  {
    path: "/",
    loader: async ({ params, query }) => {
      return { title: "Home Page" };
    },
  },
];
```

### `ssrRoutes`

Routes that are **server-side rendered on every request**. The loader runs on the server each time a user visits the page.

```js
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

### Default Behavior

Any route **not listed** in either `ssgRoutes` or `ssrRoutes` is treated as SSG by default. In development, it renders client-side. In production, if a pre-rendered HTML file exists in `dist/client/`, it is served.

---

## Loader API

Every route (SSG or SSR) can have a `loader` function.

### Signature

```js
async function loader({ params, query }) {
  // params: URL path parameters (e.g., { id: "42" } for /post/:id)
  // query: URL query parameters (e.g., { page: "2" } for ?page=2)
  return data; // Any serializable value
}
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `params` | `Object` | Path parameters extracted from the URL pattern |
| `query` | `Object` | Query string parameters from the URL |

### Return Value

The loader must return a **JSON-serializable** value. This value is:
1. Serialized to JSON
2. Injected into the HTML as `window.__LOADER_DATA__`
3. Available in components via `useLoaderData()`

### Error Handling

If a loader throws an error, the server responds with a 500 status and the error stack trace (in development) or a generic error (in production).

---

## LoaderDataContext

Located at `src/context/LoaderDataContext.jsx`. Provides two exports:

### `LoaderDataProvider`

A React context provider that wraps your app and supplies loader data.

```jsx
<LoaderDataProvider data={loaderData}>
  <App />
</LoaderDataProvider>
```

For the most part you will not need to use this directly — it is handled automatically by `entry-client.jsx` and `entry-server.jsx`.

### `useLoaderData()`

A hook to access the current route's loader data inside any component.

```jsx
import { useLoaderData } from "./context/LoaderDataContext";

export default function MyPage() {
  const data = useLoaderData();
  return <h1>{data.title}</h1>;
}
```

Returns `null` if no loader data is available (e.g., for routes without loaders).

---

## Server Behavior

The Express server (`server.js`) handles all routes through a unified pipeline:

### Request Flow

```
Request → Match SSR route? → Yes → Run loader → SSR render → Send HTML
                           → No  → Match SSG route?
                                    → Yes → (Prod) Serve pre-rendered HTML
                                          → (Dev) Run loader → SSR render → Send HTML
                                    → No  → Render without loader data → Send HTML
```

### Development Mode (`optimized-frontend-dev`)

- Vite dev server runs in middleware mode
- HMR (Hot Module Replacement) is active
- `renderingConfig.js` is hot-reloaded on every request
- All routes are server-rendered live (no pre-rendered files)

### Production Mode (`optimized-frontend-prod`)

- Static assets served via `sirv` with compression
- SSG routes: pre-rendered HTML files served from `dist/client/`
- SSR routes: loader runs and page renders on every request

### Data Injection

Loader data is serialized and injected into the HTML head:

```html
<script>window.__LOADER_DATA__ = {"title":"Home"};</script>
```

The `<` character is escaped as `\u003c` to prevent XSS via script injection.

---

## Build Pipeline

### `npm run build`

Runs two Vite builds sequentially:

1. **Client build** (`vite build --outDir dist/client`)  
   Produces the browser bundle, CSS, and `index.html`.

2. **Server build** (`vite build --ssr src/entry-server.jsx --outDir dist/server`)  
   Produces the Node.js SSR bundle.

### `npm run prerender` (runs automatically after build)

Executes `scripts/prerender.js`:

1. Imports `renderingConfig.js` to read all SSG routes
2. For each SSG route:
   - Runs the loader with `{ params: {}, query: {} }`
   - Renders the page to an HTML string via `entry-server.js`
   - Injects the `__LOADER_DATA__` script tag
   - Writes the HTML file to `dist/client/<route>.html`

---

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `undefined` | Set to `production` for production mode |
| `PORT` | `5173` | Server port |
| `BASE` | `/` | Base URL path for the app |

---

## File Reference

| File | Purpose |
| --- | --- |
| `renderingConfig.js` | Route definitions with loaders |
| `server.js` | Express SSR server |
| `src/entry-client.jsx` | Client-side hydration entry |
| `src/entry-server.jsx` | Server-side render function |
| `src/App.jsx` | Root React component with routes |
| `src/router.jsx` | Route-to-component mapping |
| `src/context/LoaderDataContext.jsx` | Data context + `useLoaderData` hook |
| `scripts/prerender.js` | Build-time SSG pre-renderer |
| `index.html` | HTML template with `<!--app-html-->` placeholder |
