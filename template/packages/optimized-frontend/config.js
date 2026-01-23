import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to resolve build directory relative to this file
// Assuming structure: packages/ssr/index.js -> packages/frontend/dist
const buildDir = path.resolve(__dirname, "../frontend/dist");

// Configuration
const PORT = 8080;
const PRERENDER_PORT = 4050; // default

// Define your routes here
const staticRoutes = [
  "/",
  // Add other static routes here, e.g., '/about', '/contact'
];

// Start the SSR service
let config = {
  buildFolder: buildDir,
  staticRoutes,
  dynamicRoutes: [
    {
      path: "/post/:id",
      templateRoute: "/post-page-template",
      loader: async ({ params }) => {
        // Fetch data based on params.id
        // const res = await fetch(`https://api.example.com/posts/${params.id}`);
        // return res.json();

        let res = await fetch(
          "https://jsonplaceholder.typicode.com/posts/" + params.id,
        );

        let data = await res.json();

        return data;
      },
      sitemapGenerator: async () => {
        return {
          uniqueName: "posts",
          total: 100000,
          loader: async ({ limit, itemsToSkip }) => {
            // In a real app, this would fetch from database
            // mocking functionality for now
            let items = [];
            for (let i = 0; i < limit; i++) {
              items.push({
                url: `/post/${itemsToSkip + i}`,
                lastUpdatedAt: new Date().toISOString(),
              });
            }
            return items;
          },
        };
      },
    },
  ],
  port: PORT,
  prerenderingPort: PRERENDER_PORT,
  staticRendering: "BOT_ONLY", // or 'BOT_ONLY'
  dynamicRendering: "BOT_ONLY", // or 'BOT_ONLY'
  domain: "https://example.com",
};

export default config;
