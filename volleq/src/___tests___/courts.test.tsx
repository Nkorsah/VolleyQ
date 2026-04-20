import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNewCourt, getCourtQueue, joinCourtQueue,
  advanceCourtQueue, startCourtMatch, endCourtMatch,
  getNextMatchup, isTeamInQueue, getTeamQueuePosition,
  isMatchOngoing, getMatchScore, hasTeamReachedScoreLimit,
  getMatchWinner,
} from '../api/courts';
import type { Match, HydratedQueueEntry } from '../api/api';

const {
  mockCreateCourt, mockFetchQueue, mockJoinQueue,
  mockAdvanceQueue, mockStartMatch, mockEndMatch,
} = vi.hoisted(() => ({
  mockCreateCourt: vi.fn(),
  mockFetchQueue: vi.fn(),
  mockJoinQueue: vi.fn(),
  mockAdvanceQueue: vi.fn(),
  mockStartMatch: vi.fn(),
  mockEndMatch: vi.fn(),
}));

vi.mock('../api/court', () => ({
  createCourt: mockCreateCourt,
  fetchQueue: mockFetchQueue,
  joinQueue: mockJoinQueue,
  advanceQueue: mockAdvanceQueue,
  startMatch: mockStartMatch,
  endMatch: mockEndMatch,
}));

const mockToken = 'mock-auth-token';
const mockCourtID = 'court-123';

const mockCreateCourtRequest = {
  court_name: 'Court 1',
  max_teams_in_queue: 8,
  queue_type: 'CIRCULAR' as const,
  score_limit: 25,
  venueID: 'venue-123',
};

const mockCourtResponse = {
  court: { courtID: mockCourtID, court_settings: mockCreateCourtRequest },
  match: { matchID: 'match-123', ongoing: false },
  queue: { queueID: 'queue-123', team_queue: [] },
};

const mockQueue: HydratedQueueEntry[] = [
  { teamID: 'team-1', name: 'Team Alpha' },
  { teamID: 'team-2', name: 'Team Beta' },
  { teamID: 'team-3', name: 'Team Gamma' },
];

const mockOngoingMatch: Match = {
  matchID: 'match-123',
  courtID: mockCourtID,
  queueID: 'queue-123',
  team1: { teamID: 'team-1', team_name: 'Team Alpha', team_score: 20, team_color: 'blue' },
  team2: { teamID: 'team-2', team_name: 'Team Beta', team_score: 18, team_color: 'red' },
  ongoing: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockIdleMatch: Match = {
  ...mockOngoingMatch,
  ongoing: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createNewCourt', () => {
  it('calls createCourt with correct data and token', async () => {
    mockCreateCourt.mockResolvedValueOnce(mockCourtResponse);

    await createNewCourt(mockCreateCourtRequest, mockToken);

    expect(mockCreateCourt).toHaveBeenCalledWith(mockCreateCourtRequest, mockToken);
  });

  it('returns court response on success', async () => {
    mockCreateCourt.mockResolvedValueOnce(mockCourtResponse);

    const result = await createNewCourt(mockCreateCourtRequest, mockToken);

    expect(result).toEqual(mockCourtResponse);
  });

  it('throws if court_name is empty', async () => {
    await expect(createNewCourt({ ...mockCreateCourtRequest, court_name: '' }, mockToken))
      .rejects.toThrow('Court name is required');
    expect(mockCreateCourt).not.toHaveBeenCalled();
  });

  it('throws if court_name is only whitespace', async () => {
    await expect(createNewCourt({ ...mockCreateCourtRequest, court_name: '   ' }, mockToken))
      .rejects.toThrow('Court name is required');
    expect(mockCreateCourt).not.toHaveBeenCalled();
  });

  it('throws if venueID is missing', async () => {
    await expect(createNewCourt({ ...mockCreateCourtRequest, venueID: '' }, mockToken))
      .rejects.toThrow('venueID is required');
    expect(mockCreateCourt).not.toHaveBeenCalled();
  });

  it('throws if score_limit is less than 1', async () => {
    await expect(createNewCourt({ ...mockCreateCourtRequest, score_limit: 0 }, mockToken))
      .rejects.toThrow('score_limit must be at least 1');
    expect(mockCreateCourt).not.toHaveBeenCalled();
  });

  it('throws if max_teams_in_queue is less than 2', async () => {
    await expect(createNewCourt({ ...mockCreateCourtRequest, max_teams_in_queue: 1 }, mockToken))
      .rejects.toThrow('max_teams_in_queue must be at least 2');
    expect(mockCreateCourt).not.toHaveBeenCalled();
  });

  it('throws if token is missing', async () => {
    await expect(createNewCourt(mockCreateCourtRequest, ''))
      .rejects.toThrow('Auth token is required');
    expect(mockCreateCourt).not.toHaveBeenCalled();
  });

  it('throws if createCourt fails', async () => {
    mockCreateCourt.mockRejectedValueOnce(new Error('Network error'));

    await expect(createNewCourt(mockCreateCourtRequest, mockToken))
      .rejects.toThrow('Network error');
  });
});

describe('getCourtQueue', () => {
  it('calls fetchQueue with courtID', async () => {
    mockFetchQueue.mockResolvedValueOnce(mockQueue);

    await getCourtQueue(mockCourtID);

    expect(mockFetchQueue).toHaveBeenCalledWith(mockCourtID);
  });

  it('returns queue on success', async () => {
    mockFetchQueue.mockResolvedValueOnce(mockQueue);

    const result = await getCourtQueue(mockCourtID);

    expect(result).toEqual(mockQueue);
  });

  it('throws if courtID is empty', async () => {
    await expect(getCourtQueue('')).rejects.toThrow('courtID is required');
    expect(mockFetchQueue).not.toHaveBeenCalled();
  });

  it('throws if fetchQueue fails', async () => {
    mockFetchQueue.mockRejectedValueOnce(new Error('Network error'));

    await expect(getCourtQueue(mockCourtID)).rejects.toThrow('Network error');
  });
});


describe('joinCourtQueue', () => {
  it('calls joinQueue with courtID and token', async () => {
    mockJoinQueue.mockResolvedValueOnce({
      message: 'Team Join success!',
      team: '{}',
      team_queue: ['team-1'],
    });

    await joinCourtQueue(mockCourtID, mockToken);

    expect(mockJoinQueue).toHaveBeenCalledWith(mockCourtID, mockToken);
  });

  it('throws if courtID is empty', async () => {
    await expect(joinCourtQueue('', mockToken)).rejects.toThrow('courtID is required');
    expect(mockJoinQueue).not.toHaveBeenCalled();
  });

  it('throws if token is empty', async () => {
    await expect(joinCourtQueue(mockCourtID, '')).rejects.toThrow('Auth token is required');
    expect(mockJoinQueue).not.toHaveBeenCalled();
  });

  it('throws if joinQueue fails', async () => {
    mockJoinQueue.mockRejectedValueOnce(new Error('User is not a team leader'));

    await expect(joinCourtQueue(mockCourtID, mockToken))
      .rejects.toThrow('User is not a team leader');
  });
});


describe('advanceCourtQueue', () => {
  it('calls advanceQueue with courtID and token', async () => {
    mockAdvanceQueue.mockResolvedValueOnce({
      message: 'FIFO: queue has been updated',
      removed_teamID: 'team-1',
    });

    await advanceCourtQueue(mockCourtID, mockToken);

    expect(mockAdvanceQueue).toHaveBeenCalledWith(mockCourtID, mockToken);
  });

  it('throws if courtID is empty', async () => {
    await expect(advanceCourtQueue('', mockToken)).rejects.toThrow('courtID is required');
    expect(mockAdvanceQueue).not.toHaveBeenCalled();
  });

  it('throws if token is empty', async () => {
    await expect(advanceCourtQueue(mockCourtID, '')).rejects.toThrow('Auth token is required');
    expect(mockAdvanceQueue).not.toHaveBeenCalled();
  });

  it('throws if advanceQueue fails', async () => {
    mockAdvanceQueue.mockRejectedValueOnce(new Error('Match is still ongoing'));

    await expect(advanceCourtQueue(mockCourtID, mockToken))
      .rejects.toThrow('Match is still ongoing');
  });
});

describe('startCourtMatch', () => {
  it('calls startMatch with courtID and token', async () => {
    mockStartMatch.mockResolvedValueOnce('Match started!');

    await startCourtMatch(mockCourtID, mockToken);

    expect(mockStartMatch).toHaveBeenCalledWith(mockCourtID, mockToken);
  });

  it('returns success message', async () => {
    mockStartMatch.mockResolvedValueOnce('Match started!');

    const result = await startCourtMatch(mockCourtID, mockToken);

    expect(result).toBe('Match started!');
  });

  it('throws if courtID is empty', async () => {
    await expect(startCourtMatch('', mockToken)).rejects.toThrow('courtID is required');
    expect(mockStartMatch).not.toHaveBeenCalled();
  });

  it('throws if token is empty', async () => {
    await expect(startCourtMatch(mockCourtID, '')).rejects.toThrow('Auth token is required');
    expect(mockStartMatch).not.toHaveBeenCalled();
  });

  it('throws if startMatch fails', async () => {
    mockStartMatch.mockRejectedValueOnce(new Error('At least 2 teams required'));

    await expect(startCourtMatch(mockCourtID, mockToken))
      .rejects.toThrow('At least 2 teams required');
  });
});

describe('endCourtMatch', () => {
  it('calls endMatch with courtID and token', async () => {
    mockEndMatch.mockResolvedValueOnce('Match has ended');

    await endCourtMatch(mockCourtID, mockToken);

    expect(mockEndMatch).toHaveBeenCalledWith(mockCourtID, mockToken);
  });

  it('returns success message', async () => {
    mockEndMatch.mockResolvedValueOnce('Match has ended');

    const result = await endCourtMatch(mockCourtID, mockToken);

    expect(result).toBe('Match has ended');
  });

  it('throws if courtID is empty', async () => {
    await expect(endCourtMatch('', mockToken)).rejects.toThrow('courtID is required');
    expect(mockEndMatch).not.toHaveBeenCalled();
  });

  it('throws if token is empty', async () => {
    await expect(endCourtMatch(mockCourtID, '')).rejects.toThrow('Auth token is required');
    expect(mockEndMatch).not.toHaveBeenCalled();
  });

  it('throws if endMatch fails', async () => {
    mockEndMatch.mockRejectedValueOnce(new Error('Score limit not reached'));

    await expect(endCourtMatch(mockCourtID, mockToken))
      .rejects.toThrow('Score limit not reached');
  });
});

describe('getNextMatchup', () => {
  it('returns first two teams in queue', () => {
    const result = getNextMatchup(mockQueue);

    expect(result).toEqual([mockQueue[0], mockQueue[1]]);
  });

  it('returns null if queue has fewer than 2 teams', () => {
    expect(getNextMatchup([])).toBeNull();
    expect(getNextMatchup([mockQueue[0]])).toBeNull();
  });

  it('returns correct teams with exactly 2 in queue', () => {
    const result = getNextMatchup([mockQueue[0], mockQueue[1]]);

    expect(result![0].teamID).toBe('team-1');
    expect(result![1].teamID).toBe('team-2');
  });
});

describe('isTeamInQueue', () => {
  it('returns true if team is in queue', () => {
    expect(isTeamInQueue(mockQueue, 'team-1')).toBe(true);
  });

  it('returns false if team is not in queue', () => {
    expect(isTeamInQueue(mockQueue, 'team-99')).toBe(false);
  });

  it('returns false for empty queue', () => {
    expect(isTeamInQueue([], 'team-1')).toBe(false);
  });
});

describe('getTeamQueuePosition', () => {
  it('returns correct 1-based position', () => {
    expect(getTeamQueuePosition(mockQueue, 'team-1')).toBe(1);
    expect(getTeamQueuePosition(mockQueue, 'team-2')).toBe(2);
    expect(getTeamQueuePosition(mockQueue, 'team-3')).toBe(3);
  });

  it('returns 0 if team is not in queue', () => {
    expect(getTeamQueuePosition(mockQueue, 'team-99')).toBe(0);
  });

  it('returns 0 for empty queue', () => {
    expect(getTeamQueuePosition([], 'team-1')).toBe(0);
  });
});

describe('isMatchOngoing', () => {
  it('returns true if match is ongoing', () => {
    expect(isMatchOngoing(mockOngoingMatch)).toBe(true);
  });

  it('returns false if match is not ongoing', () => {
    expect(isMatchOngoing(mockIdleMatch)).toBe(false);
  });
});

describe('getMatchScore', () => {
  it('returns correct scores for both teams', () => {
    const result = getMatchScore(mockOngoingMatch);

    expect(result).toEqual({ team1: 20, team2: 18 });
  });

  it('returns null if team1 is missing', () => {
    expect(getMatchScore({ ...mockOngoingMatch, team1: null })).toBeNull();
  });

  it('returns null if team2 is missing', () => {
    expect(getMatchScore({ ...mockOngoingMatch, team2: null })).toBeNull();
  });

  it('returns null if both teams are missing', () => {
    expect(getMatchScore({ ...mockOngoingMatch, team1: null, team2: null })).toBeNull();
  });
});

describe('hasTeamReachedScoreLimit', () => {
  it('returns true if team1 reaches score limit', () => {
    const match = {
      ...mockOngoingMatch,
      team1: { ...mockOngoingMatch.team1!, team_score: 25 },
    };
    expect(hasTeamReachedScoreLimit(match, 25)).toBe(true);
  });

  it('returns true if team2 reaches score limit', () => {
    const match = {
      ...mockOngoingMatch,
      team2: { ...mockOngoingMatch.team2!, team_score: 25 },
    };
    expect(hasTeamReachedScoreLimit(match, 25)).toBe(true);
  });

  it('returns false if neither team reaches score limit', () => {
    expect(hasTeamReachedScoreLimit(mockOngoingMatch, 25)).toBe(false);
  });

  it('returns false if teams are missing', () => {
    expect(hasTeamReachedScoreLimit({ ...mockOngoingMatch, team1: null, team2: null }, 25))
      .toBe(false);
  });
});

describe('getMatchWinner', () => {
  it('returns team1 ID if team1 has higher score', () => {
    const match = {
      ...mockOngoingMatch,
      team1: { ...mockOngoingMatch.team1!, team_score: 25 },
      team2: { ...mockOngoingMatch.team2!, team_score: 20 },
    };
    expect(getMatchWinner(match)).toBe('team-1');
  });

  it('returns team2 ID if team2 has higher score', () => {
    const match = {
      ...mockOngoingMatch,
      team1: { ...mockOngoingMatch.team1!, team_score: 20 },
      team2: { ...mockOngoingMatch.team2!, team_score: 25 },
    };
    expect(getMatchWinner(match)).toBe('team-2');
  });

  it('returns null if teams are missing', () => {
    expect(getMatchWinner({ ...mockOngoingMatch, team1: null })).toBeNull();
  });
});