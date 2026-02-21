/**
 * Rendering Configuration
 *
 * This file defines which routes are SSR (server-side rendered on every request)
 * and which routes are SSG (statically generated at build time).
 *
 * Any route NOT listed here defaults to SSG behavior.
 *
 * Each route must have:
 *   - path: The route path pattern (supports :param syntax)
 *   - loader: An async function that returns data for the route
 *             Receives { params, query } as arguments
 */

export const ssgRoutes = [
    {
        path: "/",
        loader: async () => {
            return {
                title: "Welcome to Start Simple",
                description: "A minimal full-stack setup with SSR & SSG support.",
            };
        },
    },
    {
        path: "/about",
        loader: async () => {
            return {
                title: "About Start Simple",
                mission:
                    "Make SSR & SSG accessible without rewriting your frontend code.",
            };
        },
    },
];

export const ssrRoutes = [
    {
        path: "/post/:id",
        loader: async ({ params }) => {
            const res = await fetch(
                `https://jsonplaceholder.typicode.com/posts/${params.id}`,
            );
            if (!res.ok) throw new Error(`Post ${params.id} not found`);
            return res.json();
        },
    },
];
