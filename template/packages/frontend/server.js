import fs from "node:fs/promises";
import path from "node:path";
import express from "express";

// Constants
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || "/";

// ---------------------------------------------------------------------------
// Helper: match a route pattern like "/post/:id" against a URL like "/post/42"
// Returns { matched: true, params: { id: "42" } } or { matched: false }
// ---------------------------------------------------------------------------
function matchRoute(pattern, pathname) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return { matched: false };

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return { matched: false };
    }
  }
  return { matched: true, params };
}

// ---------------------------------------------------------------------------
// Helper: find a matching route in the given route list
// ---------------------------------------------------------------------------
function findMatchingRoute(routes, pathname) {
  for (const route of routes) {
    const result = matchRoute(route.path, pathname);
    if (result.matched) {
      return { route, params: result.params };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helper: parse query string into an object
// ---------------------------------------------------------------------------
function parseQuery(url) {
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) return {};
  const searchParams = new URLSearchParams(url.slice(queryIndex));
  const query = {};
  for (const [key, value] of searchParams) {
    query[key] = value;
  }
  return query;
}

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
async function createApp() {
  // In production, read the built HTML template once
  const templateHtml = isProduction
    ? await fs.readFile("./dist/client/index.template.html", "utf-8")
    : "";

  // Dynamically import the rendering config so it can be hot-reloaded in dev
  let renderingConfig;
  if (isProduction) {
    renderingConfig = await import("./renderingConfig.js");
  }

  const app = express();

  // -------------------------------------------------------------------------
  // Vite dev server (development only)
  // -------------------------------------------------------------------------
  /** @type {import('vite').ViteDevServer | undefined} */
  let vite;
  if (!isProduction) {
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      base,
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const compression = (await import("compression")).default;
    const sirv = (await import("sirv")).default;
    app.use(compression());
    app.use(base, sirv("./dist/client", { extensions: [] }));
  }

  // -------------------------------------------------------------------------
  // Handle all routes
  // -------------------------------------------------------------------------
  app.use("*all", async (req, res) => {
    try {
      const url = req.originalUrl.replace(base, "/").replace(/\/+/g, "/");
      const pathname = url.split("?")[0];
      const query = parseQuery(url);

      // -- Load the rendering config (hot-reload in dev) --------------------
      let ssrRoutes, ssgRoutes;
      if (!isProduction) {
        const configModule = await vite.ssrLoadModule("/renderingConfig.js");
        ssrRoutes = configModule.ssrRoutes || [];
        ssgRoutes = configModule.ssgRoutes || [];
      } else {
        ssrRoutes = renderingConfig.ssrRoutes || [];
        ssgRoutes = renderingConfig.ssgRoutes || [];
      }

      // -- Try to match an SSR route ----------------------------------------
      let loaderData = null;
      const ssrMatch = findMatchingRoute(ssrRoutes, pathname);
      if (ssrMatch && ssrMatch.route.loader) {
        loaderData = await ssrMatch.route.loader({
          params: ssrMatch.params,
          query,
        });
      }

      // -- If not SSR, try SSG route loader (in dev, run it; in prod, use prerendered) --
      if (!ssrMatch) {
        const ssgMatch = findMatchingRoute(ssgRoutes, pathname);

        // In production, try to serve the pre-rendered HTML file first
        if (isProduction) {
          const prerenderedPath = path.join(
            "./dist/client",
            pathname === "/" ? "index" : pathname,
          ) + ".html";
          try {
            const prerenderedHtml = await fs.readFile(prerenderedPath, "utf-8");
            return res
              .status(200)
              .set({ "Content-Type": "text/html" })
              .send(prerenderedHtml);
          } catch {
            // No pre-rendered file, fall through to live render
          }
        }

        // In dev (or if no prerendered file), run the SSG loader
        if (ssgMatch && ssgMatch.route.loader) {
          loaderData = await ssgMatch.route.loader({
            params: ssgMatch.params,
            query,
          });
        }
      }

      // -- Get HTML template & render function ------------------------------
      /** @type {string} */
      let template;
      /** @type {Function} */
      let render;

      if (!isProduction) {
        template = await fs.readFile("./index.html", "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/entry-server.jsx")).render;
      } else {
        template = templateHtml;
        render = (await import("./dist/server/entry-server.js")).render;
      }

      // -- Render the app ---------------------------------------------------
      const rendered = await render(url, loaderData);

      // -- Inject loader data as a script tag for client hydration ----------
      let loaderScript = "";
      if (loaderData !== null) {
        const serialized = JSON.stringify(loaderData).replace(/</g, "\\u003c");
        loaderScript = `<script>window.__LOADER_DATA__ = ${serialized};</script>`;
      }

      const html = template
        .replace("<!--app-head-->", (rendered.head ?? "") + loaderScript)
        .replace("<!--app-html-->", rendered.html ?? "");

      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (e) {
      vite?.ssrFixStacktrace(e);
      console.error(e.stack);
      res.status(500).end(e.stack);
    }
  });

  // -------------------------------------------------------------------------
  // Start listening
  // -------------------------------------------------------------------------
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
    if (!isProduction) {
      console.log("Mode: development (HMR enabled)");
    } else {
      console.log("Mode: production");
    }
  });
}

createApp();
