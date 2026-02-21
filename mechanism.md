# Mechanism — How Start Simple SSR/SSG Works Internally

A deep dive into the internal architecture of Start Simple's rendering pipeline.

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Request Lifecycle](#request-lifecycle)
- [Route Matching](#route-matching)
- [Data Flow: Loaders → Components](#data-flow-loaders--components)
- [Hydration](#hydration)
- [Build-Time Pre-rendering (SSG)](#build-time-pre-rendering-ssg)
- [Development vs Production](#development-vs-production)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     server.js                           │
│                                                         │
│  ┌─────────────┐     ┌──────────────────┐               │
│  │  Vite Dev   │     │ renderingConfig  │               │
│  │  Middleware  │     │  .js             │               │
│  │  (dev only) │     │  ├─ ssgRoutes    │               │
│  └──────┬──────┘     │  └─ ssrRoutes    │               │
│         │            └────────┬─────────┘               │
│         │                     │                         │
│         ▼                     ▼                         │
│  ┌──────────────────────────────────────────┐           │
│  │           Request Handler                │           │
│  │  1. Match route against config           │           │
│  │  2. Run loader (if matched)              │           │
│  │  3. Call render(url, loaderData)          │           │
│  │  4. Inject __LOADER_DATA__ script        │           │
│  │  5. Send HTML response                   │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  ┌──────────────────────────────────────────┐           │
│  │         entry-server.jsx                 │           │
│  │  renderToString(                         │           │
│  │    <StrictMode>                          │           │
│  │      <StaticRouter location={url}>       │           │
│  │        <LoaderDataProvider data={...}>   │           │
│  │          <App />                         │           │
│  │        </LoaderDataProvider>             │           │
│  │      </StaticRouter>                     │           │
│  │    </StrictMode>                         │           │
│  │  )                                       │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle

Here is exactly what happens when a user visits a page:

### Step 1: Route Matching

The server receives a request (e.g., `GET /post/42`). It strips the base path, extracts the pathname and query parameters, then tries to match the URL against the route patterns.

**Matching order:**

1. Check `ssrRoutes` first
2. If no match, check `ssgRoutes`
3. If no match in either, treat as a default route (no loader data)

The route matcher supports parameterized segments:
- `/post/:id` matches `/post/42` → `params = { id: "42" }`
- `/user/:username` matches `/user/john` → `params = { username: "john" }`

### Step 2: Loader Execution

If a matching route has a `loader` function, it is called with:

```js
const data = await route.loader({ params, query });
```

This runs **on the server** (Node.js), meaning:
- You can access databases directly
- You can use server-only APIs and secrets
- The network call is server-to-server (fast)

### Step 3: Server-Side Rendering

The `render()` function from `entry-server.jsx` is called:

```js
const rendered = render(url, loaderData);
```

Internally, this wraps the app in:
- `StaticRouter` — provides the current URL to React Router (on the server, there's no browser history)
- `LoaderDataProvider` — makes `loaderData` available via React context

Then `renderToString()` produces the full HTML of the page.

### Step 4: Data Injection

The loader data is serialized and injected as a `<script>` tag in the `<head>`:

```html
<script>window.__LOADER_DATA__ = {"id":42,"title":"Post Title","body":"..."};</script>
```

**Security:** All `<` characters are escaped as `\u003c` to prevent script-injection attacks.

### Step 5: Response

The final HTML combines:
- The `index.html` template (with `<!--app-head-->` and `<!--app-html-->` placeholders)
- The rendered HTML
- The loader data script

The complete HTML is sent with `Content-Type: text/html`.

---

## Route Matching

The route matcher is a simple, dependency-free pattern matcher in `server.js`:

```
Pattern:  /post/:id
URL:      /post/42

Split into segments:
  ["post", ":id"]  vs  ["post", "42"]

Comparison:
  "post"  === "post"  ✓
  ":id"   → capture   → params.id = "42"

Result: { matched: true, params: { id: "42" } }
```

Rules:
- Segment count must match exactly (no wildcards)
- `:param` segments capture the corresponding URL segment
- Literal segments must match exactly
- No regex or optional segments

---

## Data Flow: Loaders → Components

```
  SERVER SIDE                              CLIENT SIDE
  ──────────                              ───────────

  loader({ params, query })
       │
       ▼
  loaderData = { title: "Hello" }
       │
       ├──► render(url, loaderData)        window.__LOADER_DATA__
       │         │                              │
       │         ▼                              ▼
       │    LoaderDataProvider             LoaderDataProvider
       │         │                              │
       │         ▼                              ▼
       │    useLoaderData() → data         useLoaderData() → data
       │         │                              │
       │         ▼                              ▼
       │    <h1>{data.title}</h1>          <h1>{data.title}</h1>
       │         │                              │
       ▼         ▼                              ▼
  HTML string sent to browser ────────►  React hydrates the DOM
```

**Key insight:** Both server and client render with the **exact same data**, ensuring that the HTML produced by `renderToString` matches what the client would produce. This prevents hydration mismatches.

---

## Hydration

Hydration is the process where React "attaches" event listeners and state to the server-rendered HTML, without re-rendering the DOM.

### How it works in Start Simple:

1. **Server sends:** pre-rendered HTML + `<script>window.__LOADER_DATA__ = ...;</script>`
2. **Browser loads:** the JavaScript bundle from `entry-client.jsx`
3. **Client reads:** `window.__LOADER_DATA__` and passes it to `LoaderDataProvider`
4. **`hydrateRoot()`** compares the server HTML with what React would render
5. If they match → React attaches without re-rendering (fast!)
6. If they don't match → React logs a hydration warning and patches the DOM

### Avoiding Hydration Mismatches

Common causes of mismatches:
- **Timestamps:** `new Date()` produces different values on server vs client
- **Random values:** `Math.random()` differs between renders
- **Browser-only APIs:** `window.innerWidth` doesn't exist on the server

Solutions:
- Use the loader data for time-dependent values
- Defer browser-only rendering with `useEffect`

### Client-Side Navigation

After the initial page load, navigation is handled frictionlessly on the client by React Router `v6`. When a user clicks a `<Link>` component:

1. The URL updates without triggering a hard browser reload.
2. `LoaderDataContext` observes the `useLocation()` mutation and triggers a `useEffect`.
3. The component drops into a `<Suspense>` / loading state.
4. The requested route's `loader` function executes directly on the client, fetching JSON data from the API endpoint.
5. The data context is updated, and the new route renders cleanly without causing React to drop its mounted DOM state.

> **Note:** Because subsequent navigations trigger `renderingConfig.js` loaders fully on the client side, ensure your route configuration loaders are capable of reaching the data via an API endpoint.

---

## Build-Time Pre-rendering (SSG)

The `scripts/prerender.js` script generates static HTML at build time:

```
npm run build
  └─► vite build --outDir dist/client        (client bundle)
  └─► vite build --ssr src/entry-server.jsx   (server bundle)
  └─► node scripts/prerender.js               (SSG pre-rendering)
        │
        ├─ Import renderingConfig.js
        ├─ Import dist/server/entry-server.js
        ├─ Read dist/client/index.html (template)
        │
        └─ For each ssgRoute:
             ├─ Run loader({ params: {}, query: {} })
             ├─ render(routePath, loaderData)
             ├─ Inject __LOADER_DATA__ script
             └─ Write to dist/client/<route>.html
```

### Output structure

```
dist/client/
├── index.html          ← pre-rendered "/"
├── about.html          ← pre-rendered "/about"
├── assets/             ← JS, CSS bundles
└── vite.svg
```

In production, the server checks for pre-rendered files **before** doing a live render. This means SSG routes are served instantly without running any JavaScript.

---

## Development vs Production

| Aspect | Development | Production |
| --- | --- | --- |
| Module loading | Vite `ssrLoadModule` (on demand) | `import()` from built files |
| HMR | ✅ Active (Vite middleware) | ❌ Not available |
| Config reloading | ✅ Hot-reloaded every request | ❌ Loaded once at startup |
| SSG pages | Rendered live (loader runs each time) | Served from pre-built HTML |
| SSR pages | Rendered live | Rendered live |
| Static assets | Served by Vite | Served by `sirv` + `compression` |
| Template | Read from `./index.html` fresh | Cached in memory |

---

## Security Considerations

### Loader Data Serialization

Loader data is embedded in the HTML as:

```html
<script>window.__LOADER_DATA__ = {...};</script>
```

To prevent XSS:
- `<` is escaped as `\u003c` (prevents `</script>` injection)
- Only JSON-serializable data is supported

### Loader Execution

Loaders run on the server. Be careful about:
- Not exposing secrets in the returned data (it's sent to the client)
- Validating `params` to prevent injection attacks
- Handling errors gracefully to avoid leaking stack traces in production
