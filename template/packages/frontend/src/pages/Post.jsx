import { useParams, Link } from "react-router-dom";
import { useLoaderData } from "../context/LoaderDataContext";

export default function Post() {
    const { id } = useParams();
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
            <Link to="/">← Back to Home</Link>
            <h1>{data.title}</h1>
            <p>{data.body}</p>
            <small>Post ID: {id} (from useParams)</small>
        </div>
    );
}
