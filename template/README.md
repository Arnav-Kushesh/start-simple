# Start Simple JS

A robust, minimal, full-stack monorepo template with built-in support for Server-Side Rendering (SSR) and Static Site Generation (SSG) in React 19 and Vite 7. 

## What is this?

Start Simple JS provides a clean starting point for React applications that need high-performance SEO-friendly rendering without the complexity of heavy meta-frameworks like Next.js or Remix. 

It handles dual-mode rendering (SSR and SSG) gracefully while allowing you to write standard React code. 

### Key Features
- **Route-based Rendering Config**: Granularly define which routes are SSG (rendered at build time) and which are SSR (rendered dynamically per request).
- **Data Loaders**: Fetch data seamlessly on the server or at build time, securely injecting it into the React tree during hydration.
- **No Dual React Instances**: Avoids common Vite SSR traps by keeping the server rendering and hydration pathways completely independent cleanly.
- **Fast Vite HMR**: Enjoy incredibly fast Hot Module Replacement during development, even alongside SSR workflows.

## Quick Start

### 1. Install Dependencies
Navigate into the `template` directory and install all packages:
```bash
cd template
npm install
```

### 2. Start the Development Server
This runs the frontend in SSR mode with Vite HMR enabled. Modifying components will hot-reload while still fetching initial loader data safely via the server.
```bash
npm run dev
```

### 3. Production Build & Start
Generate the client/server bundles, run the SSG pre-renderer to output static files, and start the production Express server:
```bash
npm run build
npm run prerender
npm run start
```
*Note: In production, SSG routes are served extremely fast as static `.html` files, bypassing the React rendering engine entirely.*

## Project Structure

```
template/
├── packages/
│   ├── frontend/
│   │   ├── dist/                 # Production output (client/server bundles)
│   │   ├── src/                  # React source code (pages, components, entry points)
│   │   ├── scripts/
│   │   │   └── prerender.js      # Build-time script to generate SSG HTML 
│   │   ├── renderingConfig.js    # Defines SSR vs SSG routes & data loaders
│   │   ├── server.js             # Express server for SSR & SSG fallback
│   │   ├── vite.config.js        # Vite configuration
│   │   └── index.html            # Main HTML template 
│   └── backend/                  # (Placeholder for future backend packages)
├── turbo.json                    # TurboRepo configuration
└── package.json                  # Root monorepo workspace package 
```

## Learn More

Check out the detailed documentation documents below to master this architecture:

1. **[Tutorial](./tutorial.md)**: A step-by-step guide to adding new pages, routes, and data loaders.
2. **[Documentation Reference](./documentation.md)**: Comprehensive API docs for the `renderingConfig.js` and `LoaderDataContext`.
3. **[Under the Hood: The Mechanism](./mechanism.md)**: A deep-dive into how the custom SSR/SSG pipeline works without typical React Router hydration errors.
