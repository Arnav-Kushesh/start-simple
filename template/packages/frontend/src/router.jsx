import Home from "./pages/Home";
import About from "./pages/About";
import Post from "./pages/Post";

/**
 * Application route definitions.
 *
 * Each route maps a path to a React component.
 * The loader data for the matched route is provided
 * automatically via LoaderDataProvider.
 */
const routes = [
    { path: "/", Component: Home },
    { path: "/about", Component: About },
    { path: "/post/:id", Component: Post },
];

export default routes;

/**
 * Simple route matcher for server-side rendering.
 * Matches a URL pathname against the route definitions.
 */
export function matchRoute(pathname) {
    for (const route of routes) {
        const patternParts = route.path.split("/").filter(Boolean);
        const pathParts = pathname.split("/").filter(Boolean);

        if (patternParts.length !== pathParts.length) continue;

        let matched = true;
        for (let i = 0; i < patternParts.length; i++) {
            if (!patternParts[i].startsWith(":") && patternParts[i] !== pathParts[i]) {
                matched = false;
                break;
            }
        }
        if (matched) return route;
    }
    return routes[0]; // fallback to home
}
