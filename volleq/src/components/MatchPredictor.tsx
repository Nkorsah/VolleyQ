// client/src/components/MatchPredictor.tsx
import { useState, useEffect } from 'react';
import { predictMatchWinner } from '../api/api';
import type { MatchPredictionRequest } from '../api/api';
import type { Match } from '../api/api';

type Props = {
  match: Match;
  score_limit: number;
  autoPredict?: boolean;
};

type Prediction = {
  predicted_winner: string;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
};

const CONFIDENCE_STYLES: Record<string, string> = {
  low: 'bg-gray-200 text-gray-800',
  medium: 'bg-yellow-300 text-yellow-900',
  high: 'bg-green-400 text-green-900',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  low: '🤔 Low Confidence',
  medium: '🟡 Medium Confidence',
  high: '✅ High Confidence',
};

export function MatchPredictor({ match, score_limit, autoPredict = false }: Props) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPredictedScore, setLastPredictedScore] = useState<string | null>(null);

  // Current score signature — used to detect changes
  const scoreSignature = `${match.team1?.team_score}-${match.team2?.team_score}`;

  // Auto re-predict when score changes
  useEffect(() => {
    if (!autoPredict) return;
    if (!match.ongoing) return;
    if (!match.team1 || !match.team2) return;
    if (scoreSignature === lastPredictedScore) return;

    handlePredict();
  }, [scoreSignature, autoPredict, match.ongoing]);

  const handlePredict = async () => {
    if (!match.team1 || !match.team2) return;

    setLoading(true);
    setError(null);

    try {
      const payload: MatchPredictionRequest = {
        courtID: match.courtID,
        team1: {
          teamID: match.team1.teamID,
          team_name: match.team1.team_name,
          team_score: match.team1.team_score,
          skill_level: (match.team1 as any).skill_level,
        },
        team2: {
          teamID: match.team2.teamID,
          team_name: match.team2.team_name,
          team_score: match.team2.team_score,
          skill_level: (match.team2 as any).skill_level,
        },
        score_limit,
      };

      const result = await predictMatchWinner(payload);
      setPrediction(result.prediction as unknown as Prediction);
      setLastPredictedScore(scoreSignature);
    } catch (err: any) {
      setError('Failed to get prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!match.team1 || !match.team2) return null;
  if (!match.ongoing) return null;

  return (
    <div className="bg-[#f5e7b2] border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black uppercase italic">🤖 AI Prediction</h3>
        <button
          onClick={handlePredict}
          disabled={loading}
          className="px-4 py-2 bg-yellow-400 border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Predicting...' : 'Predict Winner'}
        </button>
      </div>

      {/* Live score display */}
      <div className="grid grid-cols-3 items-center gap-2 mb-4">
        <div className="text-center">
          <p className="font-black text-sm uppercase truncate">{match.team1.team_name}</p>
          <p className="text-4xl font-black">{match.team1.team_score}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-500 uppercase">vs</p>
          <p className="text-xs font-bold text-gray-500">/{score_limit}</p>
        </div>
        <div className="text-center">
          <p className="font-black text-sm uppercase truncate">{match.team2.team_name}</p>
          <p className="text-4xl font-black">{match.team2.team_score}</p>
        </div>
      </div>

      {/* Score progress bars */}
      <div className="space-y-2 mb-4">
        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span>{match.team1.team_name}</span>
            <span>{((match.team1.team_score / score_limit) * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 border-2 border-black rounded-full h-4">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((match.team1.team_score / score_limit) * 100, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span>{match.team2.team_name}</span>
            <span>{((match.team2.team_score / score_limit) * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 border-2 border-black rounded-full h-4">
            <div
              className="bg-red-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((match.team2.team_score / score_limit) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-600 text-xs font-bold border-2 border-red-400 rounded-xl p-2 mb-4">
          {error}
        </p>
      )}

      {/* Prediction result */}
      {prediction && !loading && (
        <div className="border-4 border-black rounded-2xl p-4 bg-white space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Predicted Winner</p>
              <p className="text-2xl font-black uppercase">{prediction.predicted_winner}</p>
            </div>
            <span className={`px-3 py-1 border-2 border-black rounded-full text-xs font-black uppercase ${CONFIDENCE_STYLES[prediction.confidence]}`}>
              {CONFIDENCE_LABELS[prediction.confidence]}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700 border-t-2 border-gray-200 pt-3">
            {prediction.reasoning}
          </p>
          {lastPredictedScore && (
            <p className="text-xs text-gray-400 font-bold">
              Predicted at score: {lastPredictedScore}
            </p>
          )}
        </div>
      )}

      {/* Auto predict toggle hint */}
      {autoPredict && (
        <p className="text-xs text-gray-500 font-bold mt-3 text-center uppercase">
          🔄 Auto-predicting on every score change
        </p>
      )}
    </div>
  );
}