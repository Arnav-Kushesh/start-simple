# Tutorial: Building with Start Simple JS

Welcome! In this tutorial, we will build a new feature inside the Start Simple JS architecture.

## Goal
We will create a new dynamic SSR route at `/user/:id` that fetches user data from the JSONPlaceholder API. 

## Step 1: Create the Component
First, create your page wrapper inside `packages/frontend/src/pages/User.jsx`.

```jsx
import { useLoaderData } from "../context/LoaderDataContext";

export default function UserProfile() {
  const data = useLoaderData();

  if (!data) return <p>Loading user...</p>;

  return (
    <div className="page user-profile">
      <h1>{data.name}</h1>
      <p>Email: {data.email}</p>
      <p>Company: {data.company.name}</p>
      <a href="/">← Back to Home</a>
    </div>
  );
}
```

Notice how we use the `useLoaderData()` hook. This hooks into our architecture to grab data seamlessly, whether navigating from the server on the initial render, or hydrating the client.

## Step 2: Add Component to the Router
Next, we must register our React component in the system's simple route matcher. Open `packages/frontend/src/router.jsx`.

```jsx
import Home from "./pages/Home";
import About from "./pages/About";
import Post from "./pages/Post";
import UserProfile from "./pages/User"; // Add this

const routes = [
    { path: "/", Component: Home },
    { path: "/about", Component: About },
    { path: "/post/:id", Component: Post },
    { path: "/user/:id", Component: UserProfile }, // Add this
];
```

## Step 3: Define the Route and Loader in Config
Now, let's configure the SSR engine to fetch data safely before rendering. Open `packages/frontend/renderingConfig.js`. 

We'll add our new route to the `ssrRoutes` array so that it dynamically fetches a fresh user payload on every page request.

```js
export const ssrRoutes = [
    {
        path: "/post/:id",
        loader: async ({ params }) => { ... },
    },
    {
        // Add our new user route definition
        path: "/user/:id",
        loader: async ({ params }) => {
            const res = await fetch(`https://jsonplaceholder.typicode.com/users/${params.id}`);
            if (!res.ok) throw new Error("User not found");
            return res.json();
        }
    }
];
```

## Step 4: Add a Link
We use standard `<a>` tags in Start Simple JS to avoid "dual React instance" conflicts across Server and Client Vite modules. Let's add a link on the Home page (`src/pages/Home.jsx`).

```jsx
  <nav className="page-links">
    <a href="/about">About</a>
    <span className="separator">·</span>
    <a href="/post/1">Example Post</a>
    <span className="separator">·</span>
    <a href="/user/1">User Profile</a>
  </nav>
```

## Step 5: Start the Dev Server
Run the optimized development server to test your changes with Vite HMR + SSR!
```bash
npm run dev
```

Visit the homepage and click the `User Profile` link. You'll see the page fetch data efficiently on the server and render the HTML directly to your browser for perfect SEO points!
