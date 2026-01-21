import { Link } from "react-router-dom";
import PostList from "./PostList";

function HomePage() {
  return (
    <div>
      <header>
        <h1>create-simple-fullstack-project</h1>
        <p className="subtitle">
          One of the most minimal way to create fullstack project that supports
          SSR, SSG, Sitemap Generation & Mobile Dev out of the box
        </p>
      </header>
      - Minimal learning curve - Minimal need to change frontend code -
      <div className="card-grid">
        <div className="card">
          <h3>Minimal learning curve</h3>
          <p>No need to learn a new framework</p>
        </div>
        <div className="card">
          <h3>Minimal need to change frontend code</h3>
          <p>Rewriting an application is expensive, time taking and buggy</p>
        </div>
        <div className="card">
          <h3>Works with any frontend technology</h3>
          <p>You can use any frontend technology</p>
        </div>
      </div>
      <br />
      <br />
      <PostList />
      <br />
      <br />
      <br />
      <br />
      <Link to="/post/1">Open Post 1</Link>
      <br />
      <a target="_blank" href="/post/1">
        Open Post 1 (New Tab)
      </a>
    </div>
  );
}

export default HomePage;
