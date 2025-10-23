import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const FibPage = () => {
    const [seenIndexes, setSeenIndexes] = useState([]);
    const [values, setValues] = useState({});
    const [index, setIndex] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchValues();
        fetchIndexes();
    }, []);

    const fetchValues = async () => {
        try {
            const response = await axios.get("/api/values/current");
            setValues(response.data);
        } catch (err) {
            setError("Failed to fetch current values. Please try again.");
            console.error(err);
        }
    };

    const fetchIndexes = async () => {
        try {
            const response = await axios.get("/api/values/all");
            setSeenIndexes(response.data);
        } catch (err) {
            setError("Failed to fetch seen indexes. Please try again.");
            console.error(err);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        // Input validation
        if (!index.trim()) {
            setError("Please enter an index.");
            return;
        }
        const numIndex = parseInt(index, 10);
        if (isNaN(numIndex) || numIndex < 0) {
            setError("Please enter a valid positive integer for the index.");
            return;
        }

        setLoading(true);
        try {
            await axios.post("/api/values", { index: numIndex });
            setIndex("");
            // Refetch data to update UI
            await fetchValues();
            await fetchIndexes();
        } catch (err) {
            setError("Failed to submit index. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Fibonacci Calculator</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <label htmlFor="index-input">Enter your index:</label>
                <input
                    id="index-input"
                    type="number"
                    min="0"
                    value={index}
                    onChange={(event) => setIndex(event.target.value)}
                    disabled={loading}
                    aria-describedby="index-error"
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                </button>
            </form>

            <h3>Indexes I have seen:</h3>
            <p>{seenIndexes.map(({ number }) => number).join(", ") || "None"}</p>

            <h3>Calculated Values:</h3>
            {Object.keys(values).length > 0 ? (
                Object.keys(values).map((key) => (
                    <div key={key}>
                        For index {key} I calculated {values[key]}
                    </div>
                ))
            ) : (
                <p>No values calculated yet.</p>
            )}

            <br />
            <Link to="/otherpage">Go to Other Page</Link>
        </div>
    );
};

export default FibPage;
