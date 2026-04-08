import {
  createTeam as createTeamRequest,
  fetchTeams,
  joinTeam as joinTeamRequest,
  deleteTeam as deleteTeamRequest,
  updateTeamStats as updateTeamStatsRequest,
  resetTeamStats as resetTeamStatsRequest,
  analyzeTeam as analyzeTeamRequest
} from "./api";
import type { Team, CreateTeamRequest, StatResult, AnalyzeTeamResponse } from "./api";

export async function createTeam(name: string): Promise<Team> {
  if (!name.trim()) throw new Error("Team name cannot be empty");

  const team = await createTeamRequest({ name });
  return team;
}

export async function getTeams(): Promise<Team[]> {
  const teams = await fetchTeams();
  return teams;
}

export function getTeamById(teams: Team[], teamId: string): Team | undefined {
  return teams.find((t) => t.id === teamId);
}

export async function joinTeam(teamId: string): Promise<Team> {
  if (!teamId) throw new Error("teamId is required");

  const team = await joinTeamRequest(teamId);
  return team;
}

export async function deleteTeam(teamId: string): Promise<void> {
  if (!teamId) throw new Error("teamId is required");

  await deleteTeamRequest(teamId);
}

export function isOwner(team: Team, userId: string): boolean {
  return team.ownerId === userId;
}

export function isMember(team: Team, userId: string): boolean {
  return team.memberIds.includes(userId);
}

export function getMemberCount(team: Team): number {
  return team.memberIds.length;
}

export async function recordWin(teamId: string): Promise<Team> {
  if (!teamId) throw new Error("teamId is required");
  return updateTeamStatsRequest(teamId, "win");
}

export async function recordLoss(teamId: string): Promise<Team> {
  if (!teamId) throw new Error("teamId is required");
  return updateTeamStatsRequest(teamId, "loss");
}

export async function resetStats(teamId: string): Promise<Team> {
  if (!teamId) throw new Error("teamId is required");
  return resetTeamStatsRequest(teamId);
}

export function getWinRate(team: Team): string {
  const total = team.stats.wins + team.stats.losses;
  if (total === 0) return "0%";
  return `${Math.round((team.stats.wins / total) * 100)}%`;
}

export async function analyzeTeam(teamId: string): Promise<string> {
  if (!teamId) throw new Error('teamId is required');

  const { analysis } = await analyzeTeamRequest(teamId);
  
  if (!analysis || analysis.trim() === '') {
    throw new Error('No analysis returned');
  }

  return analysis;
}
