# Under the Hood: The Mechanism

The Start Simple JS architecture tackles a pervasive issue within full-stack Vite + React setups known as the **Dual React Instance Conflict**. When pairing Client-Side Routing frameworks (like `react-router-dom`) with Vite SSR pipelines, module resolution commonly resolves the `import { renderToString } from "react-dom/server"` command against CommonJS React files instead of the ESM formats Vite leverages for HMR and plugin transforms (`@vitejs/plugin-react`).

This leads to catastrophic hydration tracking bugs like:
`Warning: Invalid hook call. Hooks can only be called inside of the body of a function component.` 
Or an entirely blank viewport after hydration wipes the SSR'd HTML.

## The Start Simple JS Fix
We completely decoupled the routing from the monolithic client-framework approach.

### 1. Unified Clean URL Matcher
Instead of passing components into a `<BrowserRouter><Routes>...</Routes></BrowserRouter>`, we use a custom lightweight route parsing utility function in `src/router.jsx`. This uses zero external React logic.

### 2. Manual Hydration
The `entry-server.jsx` processes the request URL, identifies the matching nested `<PageComponent/>`, and provides the necessary data payloads to it via Native Context API (`LoaderDataProvider`).

The client (`entry-client.jsx`) reads the path (`window.location.pathname`), fetches the respective Component via the exact same URL Matcher, and drops it into `hydrateRoot()`. 

Since no external dependencies process or control React elements during initialization, the Vite compiler perfectly synchronizes identically built Client and Server React module caches.

### 3. Native Hard-Navigation
Client Side Single-Page Application (SPA) links using `<Link>` heavily fracture context boundaries in isomorphic Vite SSR pipelines without dedicated meta-framework orchestration.

Start Simple JS opts entirely for Multi-Page Application (MPA) navigations with standard HTML `<a>` tags.
1. When you click `<a href="/about">`, the browser cleanly executes a fresh standard HTTP Request.
2. The Node.js Express Server (`server.js`) intercepts the request.
3. The Server fetches fresh Loader Data (if the route is marked under `ssrRoutes` in `renderingConfig.js`), dynamically renders the React Tree, and passes the entire serialized layout structure + Loader Payload securely back to the browser.
4. The client `hydrateRoot` perfectly attaches event-listeners to the resulting DOM payload.

### The SSG Pipeline (`prerender.js`)
To squeeze maximum performance from the environment, all routes defined inside `ssgRoutes` within `renderingConfig.js` run precisely once per deployment.

Running `npm run prerender` acts as a mock Express Server. It iteratively matches every `ssgRoute`, executes the respective Loader, and serializes the state out to flat static `*.html` files in the production `/dist/client` directory.

In production mode, Vite bypasses `renderToString` computationally by feeding `/about` directly from the cached `/dist/client/about.html` file through the `sirv` compression middleware. Fast load times, zero scaling impact!
