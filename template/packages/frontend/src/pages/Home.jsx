import { useLoaderData } from "../context/LoaderDataContext";

export default function Home() {
    const data = useLoaderData();

    return (
        <div className="page home-page">
            <h1>{data?.title || "Home"}</h1>
            <p>{data?.description || "Welcome to your app."}</p>
            <nav className="page-links">
                <a href="/about">About</a>
                <span className="separator">·</span>
                <a href="/post/1">Example Post</a>
            </nav>
        </div>
    );
}
