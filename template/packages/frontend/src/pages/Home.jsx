import { Link } from "react-router-dom";
import { useLoaderData } from "../context/LoaderDataContext";

export default function Home() {
    const data = useLoaderData();

    return (
        <div className="page home-page">
            <h1>{data?.title || "Home"}</h1>
            <p>{data?.description || "Welcome to your app."}</p>
            <nav className="page-links">
                <Link to="/about">About</Link>
                <span className="separator">·</span>
                <Link to="/post/1">Example Post</Link>
            </nav>
        </div>
    );
}
