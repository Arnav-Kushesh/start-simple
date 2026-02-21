import { createContext, useContext } from "react";

const LoaderDataContext = createContext(null);

/**
 * Provider that makes loader data available to all child components.
 *
 * On the server: data is passed directly from the server's loader execution.
 * On the client: data is read from window.__LOADER_DATA__ injected by the server.
 */
export function LoaderDataProvider({ data, children }) {
    return (
        <LoaderDataContext.Provider value={data}>
            {children}
        </LoaderDataContext.Provider>
    );
}

/**
 * Hook to access loader data within a route component.
 *
 * Usage:
 *   const data = useLoaderData();
 */
export function useLoaderData() {
    const data = useContext(LoaderDataContext);
    return data;
}

export default LoaderDataContext;
