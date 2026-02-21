/**
 * Pre-render SSG routes at build time.
 *
 * This script:
 * 1. Reads the renderingConfig to find all SSG routes
 * 2. Runs each route's loader
 * 3. Renders the page to HTML using entry-server
 * 4. Writes the static HTML files to dist/client/
 *
 * Run after `npm run build` to generate static HTML.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distClientDir = path.join(rootDir, "dist", "client");

async function prerender() {
    console.log("\n🔨 Pre-rendering SSG routes...\n");

    // Load the built server-side render function
    const { render } = await import(
        path.join(rootDir, "dist", "server", "entry-server.js")
    );

    // Load the rendering config
    const { ssgRoutes } = await import(
        path.join(rootDir, "renderingConfig.js")
    );

    // Read the built HTML template
    const templatePath = path.join(distClientDir, "index.html");
    const templateHtml = await fs.readFile(templatePath, "utf-8");

    // Preserve the original template for server.js dynamic SSR rendering
    await fs.copyFile(
        templatePath,
        path.join(distClientDir, "index.template.html")
    );

    if (!ssgRoutes || ssgRoutes.length === 0) {
        console.log("No SSG routes defined. Skipping pre-rendering.");
        return;
    }

    for (const route of ssgRoutes) {
        const routePath = route.path;

        // Run the loader
        let loaderData = null;
        if (route.loader) {
            try {
                loaderData = await route.loader({ params: {}, query: {} });
            } catch (err) {
                console.error(`  ✗ Loader failed for ${routePath}:`, err.message);
                continue;
            }
        }

        // Render the page
        const rendered = render(routePath, loaderData);

        // Inject loader data
        let loaderScript = "";
        if (loaderData !== null) {
            const serialized = JSON.stringify(loaderData).replace(/</g, "\\u003c");
            loaderScript = `<script>window.__LOADER_DATA__ = ${serialized};</script>`;
        }

        const html = templateHtml
            .replace("<!--app-head-->", (rendered.head ?? "") + loaderScript)
            .replace("<!--app-html-->", rendered.html ?? "");

        // Write the file
        const fileName = routePath === "/" ? "index" : routePath.slice(1);
        const filePath = path.join(distClientDir, `${fileName}.html`);

        // Ensure directory exists for nested routes
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, html);

        console.log(`  ✓ ${routePath} → ${path.relative(rootDir, filePath)}`);
    }

    console.log("\n✅ Pre-rendering complete!\n");
}

prerender().catch((err) => {
    console.error("Pre-rendering failed:", err);
    process.exit(1);
});
