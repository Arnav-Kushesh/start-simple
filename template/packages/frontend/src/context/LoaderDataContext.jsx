import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";
import { ssgRoutes, ssrRoutes } from "../../renderingConfig";

const LoaderDataContext = createContext(null);

const allRoutes = [...ssgRoutes, ...ssrRoutes];

/**
 * Provider that smartly manages loader data.
 *
 * On initial HTML load, it uses the server-injected `data`.
 * On subsequent SPA navigations via React Router <Link>, it detects the URL change
 * and fetches fresh data on the client by executing the route's .loader() function.
 */
export function LoaderDataProvider({ data: initialData, initialPath, children }) {
    const [data, setData] = useState(initialData);
    const location = useLocation();
    const isInitialLoad = React.useRef(true);

    useEffect(() => {
        // Skip fetching only on the very first mount (hydration)
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        let isMounted = true;

        async function fetchClientData() {
            // Find the matching route config to get its loader function
            let matchedRoute = null;
            let matchResult = null;

            for (const route of allRoutes) {
                const match = matchPath(route.path, location.pathname);
                if (match) {
                    matchedRoute = route;
                    matchResult = match;
                    break;
                }
            }

            if (matchedRoute && matchedRoute.loader) {
                // Clear existing data to trigger loading states in child components
                setData(null);
                try {
                    // Execute the loader entirely on the client
                    const payload = await matchedRoute.loader({
                        params: matchResult.params || {},
                        query: new URLSearchParams(location.search)
                    });
                    if (isMounted) setData(payload);
                } catch (error) {
                    console.error("Client-side loader error:", error);
                    if (isMounted) setData(null);
                }
            }
        }

        fetchClientData();

        return () => {
            isMounted = false;
        };
    }, [location.pathname, location.search]);

    return (
        <LoaderDataContext.Provider value={data}>
            {children}
        </LoaderDataContext.Provider>
    );
}

/**
 * Hook to access loader data within a route component.
 * Be sure to handle the `null` loading state gracefully in your component!
 */
export function useLoaderData() {
    return useContext(LoaderDataContext);
}

export default LoaderDataContext;
