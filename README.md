<div align="center">

<img alt="start-simple-logo" src="https://raw.githubusercontent.com/arnav-kushesh/start-simple/master/assets/sunflower.png" height="128"/>
<h3 style="margin-top: 9px;">StartSimple.js</h3>

<br/>

![NPM Version](https://img.shields.io/npm/v/start-simple?style=for-the-badge&labelColor=black&color=blue) ![NPM License](https://img.shields.io/npm/l/start-simple?style=for-the-badge&labelColor=black&color=blue) ![Static Badge](https://img.shields.io/badge/DISCORD-JOIN-blue?style=for-the-badge&logo=discord&labelColor=black&color=%235965f2&link=https%3A%2F%2Fdiscord.com%2Finvite%2F3XzqKYdchP)

</div>

## What is "Start Simple"

A minimal way to create fullstack project that supports SSR, SSG & sitemap generation out of the box

## Why this project was created

We wanted to create a way to add SSR & SSG features with minimal code changes on the frontend

## How Static Site Generation Works?

- Basically static site generation is done through Puppeteer at build time
- The advantage of this method is that the frontend code requires little to no change to support static generation
- All you need to do is mention all the static routes in `/optimized-frontend/config.js`
- At build time, static routes are saved on the server in rendered form
- When a user or bot tries to access that route, the saved result is served, improving SEO & performance
- Bots can easily crawl the page without needing to execute JS
- Browsers can instantly show UI without needing to do CSR to show the initial UI
- For saving the rendered static routes Puppeteer is used, Puppeteer only runs at build time. So, there is no impact on performance
- We call this method: Scrapping based SSG & SSR
- If UI on the static page relies on api requests then that data also needed to be saved at build time for SSG to work
  - To ensure that this data is not loaded again by JS use the following setup
  - After making the api requests you only need to do `window.EXPORT_STATIC_PAGE_DATA = data `
  - Then this data will be saved at build time using Puppeteer
  - After that you can use this saved data on the client side ensuring the same UI is rendered

  ```js
  let preLoadedData = window.getPreLoadedData && window.getPreLoadedData();
  ```

  - The `getPreLoadedData` function is injected by the server, you don't need to import any library to use it
  - `getPreLoadedData` checks the page path and then provides the data you assigned to `window.EXPORT_STATIC_PAGE_DATA`
  - hydration might break if non-deterministic logic is being used like Math.random, in that case you can restrict SSG to `BOT_ONLY` by passing the config `staticRendering:BOT_ONLY` in `/optimized-frontend/config.js`

## How Server Side Rendering Works?

- Let's say you have post pages. In that case static generation isn't practical because you might have thousands or millions of post pages
- We will have to do server side rendering for this
- You will have to provide list of dynamic routes with a loader function and a template in `/optimized-frontend/config.js`
- For providing the template you need to create a route in the frontend that serves the template.
- For example template can be served at /post-page-template, you can use handlebar syntax inside your react / vue component
- Make sure it is the same component structure that serves post pages
- Once the post-page-template has been saved on the server, users & bots will be prevented from visiting that route
- Data extracted from the loader function will be injected in /post-page-template to serve users when they visit /post/123 page
- The component itself it being used for templating. So hydration won't be an issue
- hydration might break if non-deterministic logic is being used like Math.random, in that case you can restrict SSR to `BOT_ONLY` by passing the config `dynamicRendering:BOT_ONLY` in `/optimized-frontend/config.js`
- The data loaded from the loader function can be accessed by using the following logic

```js
let preLoadedData = window.getPreLoadedData && window.getPreLoadedData();
```

## Use Cases

### Add SSR to a capacitor project

- Capacitor requires a clean build folder to function, but in frameworks like Next.js & Tanstack backend and frontend codebase is very closely integrated
- Capacitor can only run frontend code.
- So it takes significant workarounds to make Next.js / Tanstack work with Capacitor without compromising on SSR
- With scrapping based SSG & SSR, the capacitor project requires very minimal changes

### Huge codebase

- If you have a big project, rewriting it in Remix / Next.js / Tanstack might not be economical in some cases
- With our implementation frontend code requires very minimal changes

## Benefits

- Minimal learning curve - You only require knowledge of react & express
- Minimal need to change frontend code - Frontend is a standard react app
- Works with any frontend technology - You can replace the frontend folder with any other technology and it will still work

# Getting started

## Installation

`npx start-simple`

## Configure

Inside of `/optimized-frontend/config.js` you can mention the static and dynamic routes

```js
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
  dynamicRendering: "ALL_REQUESTS", // or 'BOT_ONLY'
  domain: "https://example.com",
};

export default config;
```

## Development

`npm run dev` Starts the backend, frontend server using TurboRepo - SSR & SSG is disabled in this case
`npm run build` Builds the project and does the pre-rendering
`npm run optimized-frontend` Frontend is started with SSR & SSG

## How to do deployment

`npm run backend` - For backend deployment
`npm run build` - For generating dist folder & doing pre-rendering
`npm run optimized-frontend` - For frontend deployment that supports SSG & SSR

- Before running `npm run optimized-frontend` you first need to run the build command so that pre-rendering can happen

## If you end up replacing the frontend folder do remember to enable hydration using the following code if you are using react

```js
import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

let container = document.getElementById("root");

let Component = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

if (container.innerHTML.trim()) {
  hydrateRoot(container, Component);
} else {
  createRoot(container).render(Component);
}
```

# How to use sitemap generator

To enable sitemap generation, you need to update your `config.js` file inside of optimized-frontend

### 1. Add Domain

Add the `domain` property to your exported config object. This is used to construct absolute URLs in the sitemap.

```js
let config = {
  // ... other config options
  domain: "https://your-domain.com",
};
```

### 2. Configure Dynamic Routes

For each dynamic route that you want to include in the sitemap, add a `sitemapGenerator` function.

The `sitemapGenerator` function should return an object with:

- `uniqueName`: A unique string identifier for this route (e.g., "posts", "products").
- `total`: The total number of items available for this route.
- `loader`: A function that fetches the data for a specific page of the sitemap.

#### Loader Function

The `loader` function receives an object with:

- `limit`: The maximum number of items to return (default is 50,000).
- `itemsToSkip`: The number of items to skip (for pagination).

It should return an array of objects, each containing:

- `url`: The relative or absolute URL of the page.
- `lastUpdatedAt` (optional): ISO date string of when the page was last modified.

### Example

Here is a complete example of how to configure a dynamic route for blog posts:

```js
const dynamicRoutes = [
  {
    path: "/post/:id",
    templateRoute: "/post-page-template",
    // ... normal loader for the page ...

    // SITEMAP CONFIGURATION
    sitemapGenerator: async () => {
      // Fetch total count from your DB
      const totalPosts = 100000;

      return {
        uniqueName: "post",
        total: totalPosts,
        loader: async ({ limit, itemsToSkip }) => {
          // Fetch batch of posts from your DB
          // const posts = await db.getPosts({ offset: itemsToSkip, limit });

          // Map to sitemap format
          return posts.map((post) => ({
            url: `/post/${post.id}`,
            lastUpdatedAt: post.updatedAt, // e.g. "2024-03-20T10:00:00Z"
          }));
        },
      };
    },
  },
];
```

## How it Works

Once configured, the following endpoints will be available:

- `/sitemap.xml`: The main sitemap index. It lists the static routes sitemap and all dynamic route sitemaps.
- `/sitemap-static.xml`: Contains all the static routes defined in your `staticRoutes` config.
- `/sitemap-<uniqueName>.xml`: An index sitemap for a specific dynamic route (e.g., `/sitemap-post.xml`). It lists the paginated sub-sitemaps.
- `/sitemap-<uniqueName>-<page>.xml`: The actual sitemap files containing the URLs (e.g., `/sitemap-post-1.xml`). Each file contains up to 50,000 URLs.
