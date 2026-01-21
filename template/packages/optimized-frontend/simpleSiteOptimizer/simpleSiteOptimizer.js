import express from "express";
import { open } from "lmdb";
import cors from "cors";
import { match } from "path-to-regexp";
import path from "path";
import Handlebars from "handlebars";

/**
 * simpleSSR function
 * @param {Object} options
 * @param {string} options.buildFolder - Absolute path to the build folder
 * @param {string[]} options.staticRoutes - List of static routes to prerender
 * @param {Array<{loader: Function, templateRoute: string, path: string}>} options.dynamicRoutes - List of dynamic routed
 * @param {number} options.port - Main server port
 * @param {number} [options.prerenderingPort=4050] - Port for prerendering server
 * @param {'BOT_ONLY' | 'ALL_REQUESTS'} [options.dynamicRendering='ALL_REQUESTS'] - Prerendering strategy for dynamic routes
 */

let removeTrailingSlashFunc = `

function removeTrailingSlash(str) {
  if (str.length > 1 && str[str.length - 1] === "/") {
    return str.slice(0, -1);
  }
  return str;
}

`;

export default async function simpleSiteOptimizer({
  buildFolder,
  staticRoutes,
  dynamicRoutes,
  port,
  prerenderingPort = 4050,
  dynamicRendering = "ALL_REQUESTS",
}) {
  const isPrerenderMode = process.env.PRERENDER_MODE == "ACTIVE";

  // 1. Validation
  if (port === prerenderingPort) {
    throw new Error("Main port and prerendering port cannot be the same");
  }

  // 2. Initialize LMDB
  // Using a temporary path or a specific path inside the package?
  // Let's use a standard cache path or just 'ssr-cache' in the current working directory for now
  const db = open({
    path: "pre-rendered-data",
    compression: true,
  });

  const templateRoutesSet = new Set(
    dynamicRoutes.map((route) => removeTrailingSlash(route.templateRoute))
  );

  // 4. Main Server
  const mainApp = express();
  mainApp.use(cors());

  // Middleware to handle requests
  mainApp.use(async (req, res, next) => {
    const reqPathRaw = req.path;
    let [reqPath, queryString] = reqPathRaw.split("?");
    reqPath = removeTrailingSlash(reqPath);
    // parse query params

    if (templateRoutesSet.has(reqPath)) {
      return res.redirect("/404");
    }

    // Check if it's a static route
    if (staticRoutes.includes(reqPath)) {
      const cached = db.get(reqPath);
      if (cached) {
        // cached is { html, data }
        const { html, data } = cached;

        const injection = `
          <script>
            window._PRELOADED_DATA_ = {
              data: ${JSON.stringify(data)},
              path: "${reqPath}"
            };
            window.getPreLoadedData = function() {
              var currentPath = removeTrailingSlash(window.location.pathname);
              if (window._PRELOADED_DATA_ && window._PRELOADED_DATA_.path === currentPath) {
                return window._PRELOADED_DATA_.data;
              }
            };

            ${removeTrailingSlashFunc}
          </script>`;

        let finalHtml = html;
        if (finalHtml.includes("</body>")) {
          finalHtml = finalHtml.replace("</body>", `${injection}</body>`);
        } else {
          finalHtml += injection;
        }
        return res.send(finalHtml);
      }
    }

    // Check if it's a dynamic route
    for (const routeConfig of dynamicRoutes) {
      // Use path-to-regexp match
      const matcher = match(routeConfig.path, {
        decode: decodeURIComponent,
        strict: false, // 👈 allow trailing slash
      });
      const result = matcher(reqPath);

      const query = Object.fromEntries(new URLSearchParams(queryString));

      if (result) {
        // Found a match
        // Check Prerendering Mode
        const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(
          req.headers["user-agent"] || "",
        );

        if (dynamicRendering === "BOT_ONLY" && !isBot) {
          break;
        }

        try {
          // Load data
          const loaderData = await routeConfig.loader({
            ...req,
            params: result.params,
            query,
          });

          // Get Template
          const cachedTemplate = db.get(routeConfig.templateRoute);
          if (!cachedTemplate) {
            console.warn(
              `Template ${routeConfig.templateRoute} not found in cache`,
            );
            break;
          }

          // cachedTemplate is { html, data }
          // For dynamic routes we only care about the HTML template
          const template = cachedTemplate.html;

          // Render Template with Handlebars
          const templateFn = Handlebars.compile(template);
          const renderedHtml = templateFn(loaderData);

          const injection = `
          <script>
            window._PRELOADED_DATA_ = {
              data: ${JSON.stringify(loaderData)},
              path: "${reqPath}"
            };
            window.getPreLoadedData = function() {
              var currentPath = removeTrailingSlash(window.location.pathname);
              if (window._PRELOADED_DATA_ && window._PRELOADED_DATA_.path === currentPath) {
                return window._PRELOADED_DATA_.data;
              }
            };

             ${removeTrailingSlashFunc}
          </script>`;

          const finalHtml = renderedHtml.replace(
            "</body>",
            `${injection}</body>`,
          );

          return res.send(finalHtml);
        } catch (err) {
          console.error(`Error handling dynamic route ${reqPath}:`, err);
          // Fallback to next()
        }
      }
    }

    next();
  });

  // Serve static files (assets etc)
  mainApp.use(express.static(buildFolder));

  // Final Fallback for SPA (if not handled above)
  mainApp.get("*", (req, res) => {
    res.sendFile(path.join(buildFolder, "index.html"));
  });

  return new Promise((resolve, reject) => {
    const server = mainApp.listen(port, () => {
      console.log(`Main server started on port ${port}`);
      console.log(`http://localhost:${port}`);
      resolve(server);
    });
    server.on("error", reject);
  });
}

function removeTrailingSlash(str) {
  if (str.length > 1 && str[str.length - 1] === "/") {
    return str.slice(0, -1);
  }
  return str;
}
