# Under the Hood: The Mechanism

The Start Simple JS architecture tackles a pervasive issue within full-stack Vite + React setups known as the **Dual React Instance Conflict**. When pairing Client-Side Routing frameworks (like `react-router-dom`) with Vite SSR pipelines, module resolution commonly resolves the `import { renderToString } from "react-dom/server"` command against CommonJS React files instead of the ESM formats Vite leverages for HMR and plugin transforms (`@vitejs/plugin-react`).

This leads to catastrophic hydration tracking bugs like:
`Warning: Invalid hook call. Hooks can only be called inside of the body of a function component.` 
Or an entirely blank viewport after hydration wipes the SSR'd HTML.

## The Hybrid Approach
We carefully integrated standard React Router v6 components with a custom SSR data-loader pipeline to preserve performance and avoid CJS/ESM module resolution conflicts (the "Dual React Instance" error) that appear natively in Vite 7.

### 1. Unified Route Data Matching
Instead of letting React Router blindly handle data fetching asynchronously on the client, our Node server intercepts every page request. The server uses a custom `matchRoute` function in `src/router.jsx` to predetermine which page component corresponds to the URL, fetches the component's loader data (`renderingConfig.js`), and injects it securely into the HTML payload via `<script>window.__LOADER_DATA__</script>`.

### 2. Component Rendering via React Router
The payload is then fed into standard `<StaticRouter>` (Server) and `<BrowserRouter>` (Client) wrappers that render `<Routes>` identically, utilizing React Router's rich hook ecosystem (e.g. `useParams`, `useLocation`) natively inside your components. By manually syncing the Loader Data context below the Router boundaries, the Vite compiler perfectly synchronizes identical Client and Server React module caches.

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
