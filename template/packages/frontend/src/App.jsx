import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Post from "./pages/Post";
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
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/post/:id" element={<Post />} />
        </Routes>
      </main>
    </div>
  );
}
