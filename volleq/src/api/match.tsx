import {
  submitMatch as submitMatchRequest,
  fetchTeamMatches,
  fetchMatch as fetchMatchRequest,
} from './api';
import type { Match, CreateMatchRequest, Set, TeamMatchRecord } from './api';

export function determineWinner(
  teamAId: string,
  teamBId: string,
  sets: Set[]
): { winnerId: string; loserId: string } {
  let teamAWins = 0;
  let teamBWins = 0;

  sets.forEach(set => {
    if (set.teamAPoints > set.teamBPoints) teamAWins++;
    else teamBWins++;
  });

  return teamAWins > teamBWins
    ? { winnerId: teamAId, loserId: teamBId }
    : { winnerId: teamBId, loserId: teamAId };
}

export function validateSets(sets: Set[]): void {
  if (!sets.length) throw new Error('At least one set is required');

  sets.forEach((set, i) => {
    if (typeof set.teamAPoints !== 'number' || typeof set.teamBPoints !== 'number') {
      throw new Error(`Set ${i + 1}: points must be numbers`);
    }
    if (set.teamAPoints < 0 || set.teamBPoints < 0) {
      throw new Error(`Set ${i + 1}: points cannot be negative`);
    }
    if (set.teamAPoints === set.teamBPoints) {
      throw new Error(`Set ${i + 1}: sets cannot end in a draw`);
    }
  });
}

export function formatSets(sets: Set[]): string {
  return sets.map(s => `${s.teamAPoints}-${s.teamBPoints}`).join(', ');
}

export function getSetsWon(sets: Set[]): { teamA: number; teamB: number } {
  return sets.reduce(
    (acc, set) => {
      if (set.teamAPoints > set.teamBPoints) acc.teamA++;
      else acc.teamB++;
      return acc;
    },
    { teamA: 0, teamB: 0 }
  );
}

export async function recordMatch(match: CreateMatchRequest): Promise<Match> {
  if (!match.courtId) throw new Error('courtId is required');
  if (!match.teamA?.id || !match.teamB?.id) throw new Error('Both teams are required');
  if (match.teamA.id === match.teamB.id) throw new Error('Teams must be different');

  validateSets(match.sets);

  return submitMatchRequest(match);
}

export async function getTeamMatches(teamId: string): Promise<TeamMatchRecord[]> {
  if (!teamId) throw new Error('teamId is required');
  return fetchTeamMatches(teamId);
}

export async function getMatch(matchId: string): Promise<Match> {
  if (!matchId) throw new Error('matchId is required');
  return fetchMatchRequest(matchId);
}