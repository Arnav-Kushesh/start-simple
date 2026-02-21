import { Routes, Route, Link } from "react-router-dom";
import routes from "./router";
import "./App.css";

/**
 * Main Application Layout.
 * Shared between client and server entry points.
 * Navigation uses native <a> tags for a multi-page app architecture
 * providing robust SSR without dual React instance issues.
 */
export default function App() {
  return (
    <div id="app">
      <header className="app-header">
        <nav>
          <Link to="/" className="nav-brand">
            Start Simple
          </Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/post/1">Post Example</Link>
          </div>
        </nav>
      </header>
      <main>
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.Component />}
            />
          ))}
        </Routes>
      </main>
    </div>
  );
}
