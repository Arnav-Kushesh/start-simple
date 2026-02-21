import { useLoaderData } from "../context/LoaderDataContext";

export default function Post() {
    const data = useLoaderData();

    if (!data) {
        return (
            <div className="page post-page">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="page post-page">
            <a href="/">← Back to Home</a>
            <h1>{data.title}</h1>
            <p>{data.body}</p>
            <small>Post ID: {data.id}</small>
        </div>
    );
}
