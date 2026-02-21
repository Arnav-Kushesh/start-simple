import "./App.css";

/**
 * Main Application Layout.
 * Shared between client and server entry points.
 * Navigation uses native <a> tags for a multi-page app architecture
 * providing robust SSR without dual React instance issues.
 */
export default function App({ children }) {
  return (
    <div id="app">
      <header className="app-header">
        <nav>
          <a href="/" className="nav-brand">
            Start Simple
          </a>
          <div className="nav-links">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/post/1">Post Example</a>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
