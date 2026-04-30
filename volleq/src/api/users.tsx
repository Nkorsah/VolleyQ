import {
  fetchUserSettings, updateSkillLevel as updateSkillLevelRequest,
  type SkillLevel, type UserSettings, type UpdateSkillResponse
} from './api';

export const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

export const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export async function getUserSettings(token: string): Promise<UserSettings> {
  if (!token) throw new Error('Auth token is required');
  return fetchUserSettings(token);
}

export async function setSkillLevel(
  skill_level: SkillLevel,
  token: string
): Promise<UpdateSkillResponse> {
  if (!SKILL_LEVELS.includes(skill_level)) {
    throw new Error('skill_level must be Beginner, Intermediate, or Advanced');
  }
  if (!token) throw new Error('Auth token is required');

  return updateSkillLevelRequest(skill_level, token);
}

export function getSkillLabel(skill_level: SkillLevel): string {
  return SKILL_LABELS[skill_level] ?? skill_level;
}