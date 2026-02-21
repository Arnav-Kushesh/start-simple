import "./index.css";
import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LoaderDataProvider } from "./context/LoaderDataContext";
import App from "./App";

// Read loader data injected by the server
const loaderData = window.__LOADER_DATA__ || null;
const initialPath = window.location.pathname;

const container = document.getElementById("root");

const AppTree = (
  <StrictMode>
    <BrowserRouter>
      <LoaderDataProvider data={loaderData} initialPath={initialPath}>
        <App />
      </LoaderDataProvider>
    </BrowserRouter>
  </StrictMode>
);

// Hydrate if server has already rendered HTML, otherwise do a full render
if (container.innerHTML.trim()) {
  hydrateRoot(container, AppTree);
} else {
  createRoot(container).render(AppTree);
}
