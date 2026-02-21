import "./index.css";
import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { LoaderDataProvider } from "./context/LoaderDataContext";
import { matchRoute } from "./router";
import App from "./App";

// Read loader data injected by the server
const loaderData = window.__LOADER_DATA__ || null;

// Match the current route to find the correct page component
const pathname = window.location.pathname;
const route = matchRoute(pathname);
const PageComponent = route.Component;

const container = document.getElementById("root");

const AppTree = (
  <StrictMode>
    <LoaderDataProvider data={loaderData}>
      <App>
        <PageComponent />
      </App>
    </LoaderDataProvider>
  </StrictMode>
);

// Hydrate if server has already rendered HTML, otherwise do a full render
if (container.innerHTML.trim()) {
  hydrateRoot(container, AppTree);
} else {
  createRoot(container).render(AppTree);
}
