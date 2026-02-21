import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { LoaderDataProvider } from "./context/LoaderDataContext";
import { matchRoute } from "./router";
import App from "./App";
import "./App.css";

/**
 * Server-side render function.
 *
 * Renders the matched page component dynamically.
 *
 * @param {string} url - The request URL
 * @param {object} loaderData - Data from the matched route's loader
 * @returns {{ html: string }} - The rendered HTML string
 */
export function render(url, loaderData) {
  const pathname = url.split("?")[0];
  const route = matchRoute(pathname);
  const PageComponent = route.Component;

  const html = renderToString(
    <StrictMode>
      <LoaderDataProvider data={loaderData}>
        <App>
          <PageComponent />
        </App>
      </LoaderDataProvider>
    </StrictMode>,
  );
  return { html };
}
