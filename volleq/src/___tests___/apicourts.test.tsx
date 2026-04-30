import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCourt, fetchQueue, joinQueue,
  advanceQueue, startMatch, endMatch,
} from '../api/api';

const { mockPost, mockGet, mockPut } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
  mockPut: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    post: mockPost,
    get: mockGet,
    put: mockPut,
    isAxiosError: (err: any) => err?.isAxiosError === true,
  },
}));

const mockToken = 'mock-auth-token';
const mockCourtID = 'court-123';

const mockCourt = {
  courtID: mockCourtID,
  venueID: 'venue-123',
  court_hostID: 'user-123',
  matchID: 'match-123',
  queueID: 'queue-123',
  queue_length: 0,
  court_settings: {
    court_name: 'Court 1',
    max_teams_in_queue: 8,
    queue_type: 'CIRCULAR',
    score_limit: 25,
  },
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockMatch = {
  matchID: 'match-123',
  courtID: mockCourtID,
  queueID: 'queue-123',
  team1: null,
  team2: null,
  ongoing: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockQueue = {
  queueID: 'queue-123',
  courtID: mockCourtID,
  matchID: 'match-123',
  queue_type: 'CIRCULAR',
  team_queue: [],
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockHydratedQueue = [
  { teamID: 'team-1', name: 'Team Alpha' },
  { teamID: 'team-2', name: 'Team Beta' },
];

const mockCreateCourtRequest = {
  court_name: 'Court 1',
  max_teams_in_queue: 8,
  queue_type: 'CIRCULAR' as const,
  score_limit: 25,
  venueID: 'venue-123',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createCourt', () => {
  it('calls POST /api/venue/court/create with correct data and token', async () => {
    mockPost.mockResolvedValueOnce({
      data: { court: mockCourt, match: mockMatch, queue: mockQueue },
    });

    await createCourt(mockCreateCourtRequest, mockToken);

    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/venue/court/create'),
      mockCreateCourtRequest,
      { headers: { Authorization: `Bearer ${mockToken}` } }
    );
  });

  it('returns court, match and queue on success', async () => {
    mockPost.mockResolvedValueOnce({
      data: { court: mockCourt, match: mockMatch, queue: mockQueue },
    });

    const result = await createCourt(mockCreateCourtRequest, mockToken);

    expect(result.court).toEqual(mockCourt);
    expect(result.match).toEqual(mockMatch);
    expect(result.queue).toEqual(mockQueue);
  });

  it('throws on network error', async () => {
    mockPost.mockRejectedValueOnce({
      isAxiosError: true,
      request: {},
    });

    await expect(createCourt(mockCreateCourtRequest, mockToken))
      .rejects.toBeDefined();
  });

  it('throws on server error', async () => {
    mockPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, statusText: 'Internal Server Error', data: {} },
    });

    await expect(createCourt(mockCreateCourtRequest, mockToken))
      .rejects.toBeDefined();
  });

  it('throws if venueID is missing', async () => {
    mockPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, statusText: 'Bad Request', data: {} },
    });

    await expect(createCourt({ ...mockCreateCourtRequest, venueID: '' }, mockToken))
      .rejects.toBeDefined();
  });
});

describe('fetchQueue', () => {
  it('calls GET /api/venue/court/:courtID/match/queue', async () => {
    mockGet.mockResolvedValueOnce({ data: mockHydratedQueue });

    await fetchQueue(mockCourtID);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining(`/${mockCourtID}/match/queue`)
    );
  });

  it('returns hydrated queue on success', async () => {
    mockGet.mockResolvedValueOnce({ data: mockHydratedQueue });

    const result = await fetchQueue(mockCourtID);

    expect(result).toEqual(mockHydratedQueue);
    expect(result).toHaveLength(2);
  });

  it('returns empty array if queue is empty', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    const result = await fetchQueue(mockCourtID);

    expect(result).toEqual([]);
  });

  it('throws on server error', async () => {
    mockGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, statusText: 'Internal Server Error', data: {} },
    });

    await expect(fetchQueue(mockCourtID)).rejects.toBeDefined();
  });
});

describe('joinQueue', () => {
  it('calls PUT /api/venue/court/:courtID/match/queue/join with token', async () => {
    mockPut.mockResolvedValueOnce({
      data: { message: 'Team Join success!', team: '{}', team_queue: ['team-1'] },
    });

    await joinQueue(mockCourtID, mockToken);

    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining(`/${mockCourtID}/match/queue/join`),
      {},
      { headers: { Authorization: `Bearer ${mockToken}` } }
    );
  });

  it('returns success message and team queue', async () => {
    const mockResponse = {
      message: 'Team Join success!',
      team: JSON.stringify({ teamID: 'team-1', team_name: 'Alpha' }),
      team_queue: ['team-1'],
    };
    mockPut.mockResolvedValueOnce({ data: mockResponse });

    const result = await joinQueue(mockCourtID, mockToken);

    expect(result.message).toBe('Team Join success!');
    expect(result.team_queue).toContain('team-1');
  });

  it('throws 403 if user is not a team leader', async () => {
    mockPut.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403, statusText: 'Forbidden', data: { message: 'User is not a team leader' } },
    });

    await expect(joinQueue(mockCourtID, mockToken)).rejects.toBeDefined();
  });

  it('throws 400 if user is not on a team', async () => {
    mockPut.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, statusText: 'Bad Request', data: { message: 'User is not on a team' } },
    });

    await expect(joinQueue(mockCourtID, mockToken)).rejects.toBeDefined();
  });

  it('throws on network error', async () => {
    mockPut.mockRejectedValueOnce({
      isAxiosError: true,
      request: {},
    });

    await expect(joinQueue(mockCourtID, mockToken)).rejects.toBeDefined();
  });
});

describe('advanceQueue', () => {
  it('calls PUT /api/venue/court/:courtID/match/queue/advance with token', async () => {
    mockPut.mockResolvedValueOnce({
      data: { message: 'FIFO: queue has been updated', removed_teamID: 'team-1' },
    });

    await advanceQueue(mockCourtID, mockToken);

    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining(`/${mockCourtID}/match/queue/advance`),
      {},
      { headers: { Authorization: `Bearer ${mockToken}` } }
    );
  });

  it('returns message and removed teamID on FIFO advance', async () => {
    mockPut.mockResolvedValueOnce({
      data: { message: 'FIFO: queue has been updated', removed_teamID: 'team-1' },
    });

    const result = await advanceQueue(mockCourtID, mockToken);

    expect(result.message).toContain('queue has been updated');
    expect(result.removed_teamID).toBe('team-1');
  });

  it('returns message only on circular advance', async () => {
    mockPut.mockResolvedValueOnce({
      data: { message: 'Circular: queue has been updated' },
    });

    const result = await advanceQueue(mockCourtID, mockToken);

    expect(result.message).toContain('Circular');
    expect(result.removed_teamID).toBeUndefined();
  });

  it('throws 409 if match is still ongoing', async () => {
    mockPut.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, statusText: 'Conflict', data: { message: 'Match is still ongoing' } },
    });

    await expect(advanceQueue(mockCourtID, mockToken)).rejects.toBeDefined();
  });

  it('throws on server error', async () => {
    mockPut.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, statusText: 'Internal Server Error', data: {} },
    });

    await expect(advanceQueue(mockCourtID, mockToken)).rejects.toBeDefined();
  });
});


describe('startMatch', () => {
  it('calls PUT /api/venue/court/:courtID/match/start with token', async () => {
    mockPut.mockResolvedValueOnce({ data: 'Match started!' });

    await startMatch(mockCourtID, mockToken);

    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining(`/${mockCourtID}/match/start`),
      {},
      { headers: { Authorization: `Bearer ${mockToken}` } }
    );
  });

  it('returns success message', async () => {
    mockPut.mockResolvedValueOnce({ data: 'Match started!' });

    const result = await startMatch(mockCourtID, mockToken);

    expect(result).toBe('Match started!');
  });

  it('throws 409 if fewer than 2 teams in queue', async () => {
    mockPut.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        statusText: 'Conflict',
        data: { message: 'At least 2 teams are required to start the match' },
      },
    });

    await expect(startMatch(mockCourtID, mockToken)).rejects.toBeDefined();
  });

  it('throws if match is already ongoing', async () => {
    mockPut.mockResolvedValueOnce({ data: 'match has already started!' });

    const result = await startMatch(mockCourtID, mockToken);

    expect(result).toContain('already started');
  });

  it('throws on server error', async () => {
    mockPut.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, statusText: 'Internal Server Error', data: {} },
    });

    await expect(startMatch(mockCourtID, mockToken)).rejects.toBeDefined();
  });
});

describe('endMatch', () => {
  it('calls PUT /api/venue/court/:courtID/match/end with token', async () => {
    mockPut.mockResolvedValueOnce({ data: 'Match has ended' });

    await endMatch(mockCourtID, mockToken);

    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining(`/${mockCourtID}/match/end`),
      {},
      { headers: { Authorization: `Bearer ${mockToken}` } }
    );
  });

  it('returns success message', async () => {
    mockPut.mockResolvedValueOnce({ data: 'Match has ended' });

    const result = await endMatch(mockCourtID, mockToken);

    expect(result).toBe('Match has ended');
  });

  it('throws 409 if score limit not reached', async () => {
    mockPut.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        statusText: 'Conflict',
        data: { message: 'A team did not reach maximum score yet' },
      },
    });

    await expect(endMatch(mockCourtID, mockToken)).rejects.toBeDefined();
  });

  it('returns message if no game is ongoing', async () => {
    mockPut.mockResolvedValueOnce({
      data: { message: 'no game is ongoing at this court' },
    });

    const result = await endMatch(mockCourtID, mockToken);

    expect(result).toBeDefined();
  });

  it('throws on server error', async () => {
    mockPut.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, statusText: 'Internal Server Error', data: {} },
    });

    await expect(endMatch(mockCourtID, mockToken)).rejects.toBeDefined();
  });
});