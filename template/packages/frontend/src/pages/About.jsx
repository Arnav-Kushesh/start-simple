import { useLoaderData } from "../context/LoaderDataContext";

export default function About() {
    const data = useLoaderData();

    return (
        <div className="page about-page">
            <h1>{data?.title || "About"}</h1>
            <p>{data?.mission || "Learn more about this project."}</p>
            <a href="/">← Back to Home</a>
        </div>
    );
}
