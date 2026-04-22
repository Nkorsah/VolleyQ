import { useState } from 'react';
import { analyzeTeam, isOwner, getWinRate } from '../api/teamcreation';
import type { Team } from '../api/api';

type Props = {
  team: Team;
  userId: string;
};

export function GeminiComponent({ team, userId }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeTeam(team.id);
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <p>Wins: {team.stats.wins}</p>
        <p>Losses: {team.stats.losses}</p>
        <p>Win Rate: {getWinRate(team)}</p>
      </div>

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Performance'}
      </button>

      {analysis && (
        <div>
          <h4>Performance Analysis</h4>
          <p>{analysis}</p>
        </div>
      )}

      {error && <p>{error}</p>}
    </div>
  );
}