import React, { useState } from 'react';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: query }),
    });
    const data = await res.json();
    setResponse(data.result);
  };

  return (
    <div>
      <h1>MemoRapp</h1>
      <form onSubmit={handleQuerySubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query"
        />
        <button type="submit">Submit</button>
      </form>
      <h2>Response:</h2>
      <p>{response}</p>
    </div>
  );
};

export default App;
