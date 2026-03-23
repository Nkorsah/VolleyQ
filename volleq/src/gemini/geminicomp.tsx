import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';



export default function GeminiComponent() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      setResponse(result.response.text());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Gemini Chat</h1>

      <textarea
        aria-label="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask something..."
        rows={4}
      />

      <button onClick={handleAsk} disabled={loading}>
        {loading ? 'Loading...' : 'Ask'}
      </button>

      {response && <p data-testid="response">{response}</p>}
      {error && <p data-testid="error">Error: {error}</p>}
    </div>
  );
}
