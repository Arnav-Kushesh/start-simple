## 🌻 Start Simple

A minimal way to create fullstack project that supports SSR, SSG & Sitemap Generation out of the box

## Why this project was created

We wanted to create a way to add SSR & SSG features with minimal code changes on the frontend

## How Static Site Generation Works?

- Basically static site generation is done through puppeteer at build time
- The advantage of this method is that the frontend code requires zero change to support static generation
- All you need to do is mention all the static routes
- At build time,the package will scrape all of those routes and save it on the server
- When a user or bot tries to access that route, the saved result is served, improving SEO & performance
- Bots can easily crawl the page without needing to execute JS
- Browsers can instantly show UI without needing to do CSR to show the initial UI
- For saving the rendered static routes puppeteer is used, puppeteer only runs at build time. So, there is no impact on performance
- We call this method: scrapping based static generation & ssr
- If UI on the static page relies on api requests then that data will also be saved during the build time
  - To ensure that this data is not loaded again by JS use the following setup
  - After making the api requests you only need to do `window.EXPORT_STATIC_PAGE_DATA = data `
  - Then this data will be saved at build time
  - After that you can use this saved data using the following logic

  ```js
  let preLoadedData = window.getPreLoadedData && window.getPreLoadedData();
  ```

  - The `getPreLoadedData` function is injected by the server, you don't need to import any library to use it
  - getPreLoadedData checks the page path and then provides the data you assigned to `window.EXPORT_STATIC_PAGE_DATA`

## How Server Side Rendering Works?

- Let's say you have post pages. In that case static generation isn't practical because you might have thousands or millions of post pages
- We will have to do server side rendering
- You will have to provide list of dynamic routes with a loader function and a template
- For providing the template you need to create a route in the frontend that serves the template.
- For example /post-page-template, you can use handlebar syntax inside your react / vue component
- Make sure it is the same component structure that serves post pages
- Once the post-page-template has been saved on the server, users & bots will be prevented from visiting that route
- Data extracted from the loader function will be injected in /post-page-template to serve users when they visit /post/123 page
- because the component itself it being used for templating, hydration won't be an issue
- hydration might break if non-deterministic logic is being used like Math.random, in that case you can restrict SSR to BOT_ONLY by passing the config `dynamicRendering:BOT_ONLY`
- The data loaded from the loader function can be accessed by using the following logic

```js
let preLoadedData = window.getPreLoadedData && window.getPreLoadedData();
```

## Use Cases

### Add SSR to a capacitor project

- Capacitor requires a clean build folder to function, but in frameworks like Next.js & Tanstack backend and frontend codebase is very closely integrated
- Capacitor is only supposed to run frontend code.
- So it takes significant workarounds to make Next.js / Tanstack to work with Capacitor without compromising on SSR
- With scrapping based static generation & ssr, the capacitor project requires little to no change

### Huge codebase

- If you have a big project, rewriting it in Remix / Next.js / Tanstack might not be economical in some cases
- With our implementation frontend code requires little to no change

## Benefits

- Minimal learning curve - You only require knowledge of react & express
- Minimal need to change frontend code - Frontend is a standard react app
- Works with any frontend technology - You can replace the frontend folder with any other technology and it will still work

## Installation

`npx start-simple`

## How to run dev server

`npm run dev` Starts the backend, frontend server using TurboRepo

## How to do deployment

`npm run backend` - For backend deployment
`npm run build` - For generating dist folder & doing pre-rendering
`npm run optimized-frontend` - For frontend deployment that supports SSG & SSR

## How to do deployment

- Before running `npm run optimized-frontend` you first need to run the build command so that pre-rendering can happen

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
