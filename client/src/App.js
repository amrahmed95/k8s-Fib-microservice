import React, { useState, useEffect } from 'react';

function App() {
  const [index, setIndex] = useState('');
  const [values, setValues] = useState({});
  const [seenIndexes, setSeenIndexes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchValues();
    fetchIndexes();
  }, []);

  async function fetchValues() {
    try {
      const res = await fetch('/api/values/current');
      const data = await res.json();
      setValues(data);
    } catch (err) {
      console.error('fetchValues error', err);
    }
  }

  async function fetchIndexes() {
    try {
      const res = await fetch('/api/values/all');
      const data = await res.json();
      setSeenIndexes(data);
    } catch (err) {
      console.error('fetchIndexes error', err);
      setSeenIndexes([]);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!index.trim()) return;
    setLoading(true);

    try {
      await fetch('/api/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      setIndex('');
      await fetchValues();
      await fetchIndexes();
    } catch (err) {
      console.error('submit error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center text-indigo-700">
          🌀 Fibonacci Calculator
        </h1>
        <p className="text-center text-gray-600">
          Enter an index number below to calculate its Fibonacci value asynchronously.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
          <input
            type="number"
            value={index}
            onChange={(e) => setIndex(e.target.value)}
            placeholder="Enter an index (e.g. 8)"
            className="w-full sm:w-2/3 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition disabled:bg-gray-400"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        {/* Seen Indexes */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-indigo-700 mb-3">Indexes Seen:</h3>
          {seenIndexes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {seenIndexes.map(({ number }) => (
                <span
                  key={number}
                  className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {number}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No indexes submitted yet.</p>
          )}
        </div>

        {/* Calculated Values */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-indigo-700 mb-3">Calculated Values:</h3>
          {Object.keys(values).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(values).map(([key, val]) => (
                <li
                  key={key}
                  className="flex justify-between bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100"
                >
                  <span className="text-gray-700">For index <strong>{key}</strong>:</span>
                  <span className="text-indigo-700 font-semibold">{val}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No calculated values yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
