import {
  createCourt,
  fetchQueue,
  joinQueue,
  advanceQueue,
  startMatch,
  endMatch,
  type Match,
  type HydratedQueueEntry,
  type CreateCourtRequest,
  type CreateCourtResponse,
} from './api';

export async function createNewCourt(
  data: CreateCourtRequest,
  token: string
): Promise<CreateCourtResponse> {
  if (!data.court_name?.trim()) throw new Error('Court name is required');
  if (!data.venueID) throw new Error('venueID is required');
  if (!data.score_limit || data.score_limit < 1) throw new Error('score_limit must be at least 1');
  if (!data.max_teams_in_queue || data.max_teams_in_queue < 2) {
    throw new Error('max_teams_in_queue must be at least 2');
  }
  if (!token) throw new Error('Auth token is required');

  return createCourt(data, token);
}

export async function getCourtQueue(courtID: string): Promise<HydratedQueueEntry[]> {
  if (!courtID) throw new Error('courtID is required');

  return fetchQueue(courtID);
}

export async function joinCourtQueue(courtID: string, token: string): Promise<{
  message: string;
  team: string;
  team_queue: string[];
}> {
  if (!courtID) throw new Error('courtID is required');
  if (!token) throw new Error('Auth token is required');

  return joinQueue(courtID, token);
}

export async function advanceCourtQueue(courtID: string, token: string): Promise<{
  message: string;
  removed_teamID?: string;
}> {
  if (!courtID) throw new Error('courtID is required');
  if (!token) throw new Error('Auth token is required');

  return advanceQueue(courtID, token);
}

export function getNextMatchup(
  queue: HydratedQueueEntry[]
): [HydratedQueueEntry, HydratedQueueEntry] | null {
  if (queue.length < 2) return null;
  return [queue[0], queue[1]];
}

export function isTeamInQueue(queue: HydratedQueueEntry[], teamID: string): boolean {
  return queue.some(entry => entry.teamID === teamID);
}

export function getTeamQueuePosition(queue: HydratedQueueEntry[], teamID: string): number {
  return queue.findIndex(entry => entry.teamID === teamID) + 1;
}

export async function startCourtMatch(courtID: string, token: string): Promise<string> {
  if (!courtID) throw new Error('courtID is required');
  if (!token) throw new Error('Auth token is required');

  return startMatch(courtID, token);
}

export async function endCourtMatch(courtID: string, token: string): Promise<string> {
  if (!courtID) throw new Error('courtID is required');
  if (!token) throw new Error('Auth token is required');

  return endMatch(courtID, token);
}

export function isMatchOngoing(match: Match): boolean {
  return match.ongoing;
}

export function getMatchScore(match: Match): { team1: number; team2: number } | null {
  if (!match.team1 || !match.team2) return null;
  return {
    team1: match.team1.team_score,
    team2: match.team2.team_score,
  };
}

export function hasTeamReachedScoreLimit(match: Match, scoreLimit: number): boolean {
  if (!match.team1 || !match.team2) return false;
  return match.team1.team_score >= scoreLimit || match.team2.team_score >= scoreLimit;
}

export function getMatchWinner(match: Match): string | null {
  if (!match.team1 || !match.team2) return null;
  if (!hasTeamReachedScoreLimit(match, match.team1.team_score)) return null;

  return match.team1.team_score > match.team2.team_score
    ? match.team1.teamID
    : match.team2.teamID;
}