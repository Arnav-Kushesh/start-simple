<div align="center">
<br/><br/>
<img alt="start-simple-logo" src="https://raw.githubusercontent.com/arnav-kushesh/start-simple/master/assets/pot.png" height="128"/>
<h3 style="margin-top: 9px;">StartSimple.js</h3>

<br/>

[![NPM Version](https://img.shields.io/npm/v/start-simple?style=for-the-badge&labelColor=black&color=blue)](https://www.npmjs.com/package/start-simple)
![NPM License](https://img.shields.io/npm/l/start-simple?style=for-the-badge&labelColor=black&color=blue) ![Static Badge](https://img.shields.io/badge/DISCORD-JOIN-blue?style=for-the-badge&logo=discord&labelColor=black&color=%235965f2&link=https%3A%2F%2Fdiscord.com%2Finvite%2F3XzqKYdchP)

</div>

<br/>

## What is Start Simple?

A minimal full-stack monorepo with **out-of-the-box SSR, SSG, and routing** — powered by Vite, React, and Express. No rewrites needed. Just configure your routes and loaders.

## Why Start Simple?

- **Zero learning curve** — if you know React and Express, you're ready.
- **No frontend rewrites** — your existing React code works as-is.
- **Route-based rendering** — declare which routes are SSR or SSG in one config file.
- **Loaders** — each route can fetch its own data server-side, just like Remix/Next.js.
- **Works with any frontend** — swap React for Vue/Svelte and the SSR pipeline still works.

## Installation

```bash
npx start-simple my-app
cd my-app
npm install
npm run dev
```

## Project Structure

```
my-app/
├── packages/
│   ├── frontend/              # Vite + React SSR app
│   │   ├── renderingConfig.js # ✨ SSG & SSR route definitions + loaders
│   │   ├── server.js          # Express SSR server (dev & prod)
│   │   ├── scripts/
│   │   │   └── prerender.js   # Build-time SSG pre-renderer
│   │   └── src/
│   │       ├── entry-client.jsx
│   │       ├── entry-server.jsx
│   │       ├── App.jsx
│   │       ├── context/
│   │       │   └── LoaderDataContext.jsx
│   │       └── pages/
│   │           ├── Home.jsx
│   │           ├── About.jsx
│   │           └── Post.jsx
│   └── backend/               # Express API server
│       └── index.js
├── package.json               # Monorepo root (npm workspaces + Turbo)
└── turbo.json
```

## Available Scripts

Run all scripts from the **monorepo root** (`my-app/`):

| Script | Description |
| --- | --- |
| `npm run dev` | Start the SSR frontend and the backend API on concurrent ports |
| `npm run frontend` | Start only the frontend SSR dev server (`node server`) |
| `npm run backend` | Start only the backend API server |
| `npm run start` | Start the frontend in **production SSR mode** (pre-rendered SSG pages served from disk) |
| `npm run build` | Build the frontend for production + pre-render SSG routes (automatically triggered) |

## Quick Start: How it Works

### 1. Define routes in `renderingConfig.js`

```js
export const ssgRoutes = [
  {
    path: "/",
    loader: async () => ({ title: "Home" }),
  },
];

export const ssrRoutes = [
  {
    path: "/post/:id",
    loader: async ({ params }) => {
      const res = await fetch(`https://api.example.com/posts/${params.id}`);
      return res.json();
    },
  },
];
```

### 2. Use loader data in your component

```jsx
import { useLoaderData } from "./context/LoaderDataContext";

export default function Post() {
  const data = useLoaderData();
  return <h1>{data.title}</h1>;
}
```

### 3. That's it!

- **SSR routes** — loader runs on the server for every request.
- **SSG routes** — loader runs at build time, HTML is saved to disk.
- **Unlisted routes** — treated as SSG by default (client-side only in dev).

## Rendering Modes

| Mode | When Loader Runs | Best For |
| --- | --- | --- |
| **SSG** | Once at build time | Static pages (home, about, blog index) |
| **SSR** | Every request | Dynamic pages (user profiles, posts, search results) |
| **Default** (unlisted) | Client-side only | Pages without data needs |

## Deployment

```bash
# 1. Build everything
npm run build

# 2. Start the production SSR server
npm run start

# 3. Start the API server
npm run backend
```

## Further Reading

- [**documentation.md**](./documentation.md) — Full API reference
- [**tutorial.md**](./tutorial.md) — Step-by-step guide to adding routes
- [**mechanism.md**](./mechanism.md) — Deep dive into how SSR/SSG works internally

## License

MIT
