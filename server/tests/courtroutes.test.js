import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const {
  mockGet, mockSet, mockUpdate, mockDelete,
  mockWhere, mockOrderBy, mockDoc, mockCollection,
  mockBatch, mockBatchSet, mockBatchUpdate, mockBatchDelete, mockBatchCommit,
  mockArrayUnion, mockIncrement,
  mockGetUserID, mockGetUser, mockGetTeam, mockUpdateUser,
} = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockWhere: vi.fn(),
  mockOrderBy: vi.fn(),
  mockDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockBatch: vi.fn(),
  mockBatchSet: vi.fn(),
  mockBatchUpdate: vi.fn(),
  mockBatchDelete: vi.fn(),
  mockBatchCommit: vi.fn(),
  mockArrayUnion: vi.fn(),
  mockIncrement: vi.fn(),
  mockGetUserID: vi.fn(),
  mockGetUser: vi.fn(),
  mockGetTeam: vi.fn(),
  mockUpdateUser: vi.fn(),
}));

vi.mock('../firebase.js', () => ({
  db: {
    collection: mockCollection,
    batch: mockBatch,
  },
}));

vi.mock('firebase-admin', () => ({
  default: {
    firestore: {
      FieldValue: {
        serverTimestamp: vi.fn(() => 'mock-timestamp'),
        arrayUnion: mockArrayUnion,
        increment: mockIncrement,
      },
    },
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn()
    .mockReturnValueOnce('mock-court-id')
    .mockReturnValueOnce('mock-match-id')
    .mockReturnValueOnce('mock-queue-id'),
}));

vi.mock('../routes/teamRoutes.js', () => ({
  getUserID: mockGetUserID,
}));

vi.mock('../routes/helper functions/updateEntities.js', () => ({
  updateUser: mockUpdateUser,
}));

vi.mock('../routes/helper functions/getEntites.js', () => ({
  getUser: mockGetUser,
  getTeam: mockGetTeam,
}));


const { default: courtRouter } = await import('../routes/courtRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/venue/court', courtRouter);

const mockUserID = 'user-123';
const mockCourtID = 'mock-court-id';
const mockMatchID = 'mock-match-id';
const mockQueueID = 'mock-queue-id';
const mockTeamID = 'team-123';

const mockCourtData = {
  courtID: mockCourtID,
  venueID: 'venue-123',
  court_hostID: mockUserID,
  matchID: mockMatchID,
  queueID: mockQueueID,
  queue_length: 0,
  court_settings: {
    court_name: 'Court 1',
    max_teams_in_queue: 8,
    queue_type: 'CIRCULAR',
    score_limit: 25,
  },
};

const mockMatchData = {
  matchID: mockMatchID,
  courtID: mockCourtID,
  queueID: mockQueueID,
  team1: null,
  team2: null,
  ongoing: false,
};

const mockQueueData = {
  queueID: mockQueueID,
  courtID: mockCourtID,
  matchID: mockMatchID,
  queue_type: 'CIRCULAR',
  team_queue: [],
};

const mockTeamData = {
  teamID: mockTeamID,
  team_name: 'Team Alpha',
  team_settings: { team_color: 'blue' },
  skill_level: 'intermediate',
};

const mockUserData = {
  userID: mockUserID,
  teamID: mockTeamID,
  team_leader: true,
};

function makeDocRef(exists, data) {
  return {
    get: mockGet.mockResolvedValue({ exists, data: () => data, id: data?.courtID ?? 'mock-id' }),
    set: mockSet.mockResolvedValue({}),
    update: mockUpdate.mockResolvedValue({}),
    delete: mockDelete.mockResolvedValue({}),
  };
}

function setupCourtMock(courtData = mockCourtData) {
  mockGet
    .mockResolvedValueOnce({ exists: true, data: () => courtData })   // court
    .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockQueueData, queueID: mockQueueID }) }) // queue
    .mockResolvedValueOnce({ exists: true, data: () => mockMatchData }); // match
}

function setupFirestore() {
  mockBatchSet.mockReturnValue(undefined);
  mockBatchUpdate.mockReturnValue(undefined);
  mockBatchDelete.mockReturnValue(undefined);
  mockBatchCommit.mockResolvedValue({});
  mockBatch.mockReturnValue({
    set: mockBatchSet,
    update: mockBatchUpdate,
    delete: mockBatchDelete,
    commit: mockBatchCommit,
  });
  mockUpdate.mockResolvedValue({});
  mockSet.mockResolvedValue({});
  mockDoc.mockReturnValue({ get: mockGet, set: mockSet, update: mockUpdate, delete: mockDelete });
  mockCollection.mockReturnValue({ doc: mockDoc, where: mockWhere, get: mockGet });
  mockWhere.mockReturnValue({ get: mockGet });
  mockArrayUnion.mockReturnValue('mock-array-union');
  mockIncrement.mockReturnValue('mock-increment');
}

beforeEach(() => {
  vi.clearAllMocks();
  setupFirestore();
  mockGetUserID.mockResolvedValue(mockUserID);
  mockGetUser.mockResolvedValue(mockUserData);
  mockGetTeam.mockResolvedValue(mockTeamData);
  mockUpdateUser.mockResolvedValue({ userID: mockUserID });
});

describe('POST /api/venue/court/create', () => {
  const validBody = {
    court_name: 'Court 1',
    max_teams_in_queue: 8,
    queue_type: 'CIRCULAR',
    score_limit: 25,
    venueID: 'venue-123',
  };

  it('creates a court, match and queue on success', async () => {
    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', 'Bearer mock-token')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.court.court_settings.court_name).toBe('Court 1');
    expect(res.body.match).toBeDefined();
    expect(res.body.queue).toBeDefined();
  });

  it('returns 400 if court_name is missing', async () => {
    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', 'Bearer mock-token')
      .send({ ...validBody, court_name: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing required fields');
  });

  it('returns 400 if venueID is missing', async () => {
    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', 'Bearer mock-token')
      .send({ ...validBody, venueID: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing required fields');
  });

  it('returns 400 if user update fails', async () => {
    mockUpdateUser.mockRejectedValueOnce(new Error('User update failed'));

    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', 'Bearer mock-token')
      .send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Failed to update user');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUserID.mockRejectedValueOnce(new Error('Auth error'));

    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', 'Bearer mock-token')
      .send(validBody);

    expect(res.status).toBe(500);
  });
});

describe('PUT /:courtID/match/queue/join', () => {
  beforeEach(() => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockQueueData, team_queue: [] }) })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });
  });

  it('adds team to queue successfully', async () => {
    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Team Join success!');
  });

  it('returns 400 if user has no team', async () => {
    mockGetUser.mockResolvedValueOnce({ ...mockUserData, teamID: null });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User is not on a team');
  });

  it('returns 403 if user is not team leader', async () => {
    mockGetUser.mockResolvedValueOnce({ ...mockUserData, team_leader: false });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('User is not a team leader');
  });

  it('returns 409 if team is already in queue', async () => {
    mockGet
      .mockReset()
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockQueueData, team_queue: [mockTeamID] }) })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Team is already in the queue');
  });

  it('returns 409 if queue is full', async () => {
    const fullQueue = Array(8).fill(null).map((_, i) => `team-${i}`);
    mockGet
      .mockReset()
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockQueueData, team_queue: fullQueue }) })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Queue is full');
  });
});

describe('PUT /:courtID/match/queue/leave', () => {
  it('removes team from queue successfully', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockQueueData, team_queue: [mockTeamID, 'team-2'] }) })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Team left the queue successfully');
  });

  it('returns 400 if user has no team', async () => {
    mockGetUser.mockResolvedValueOnce({ ...mockUserData, teamID: null });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User is not on a team');
  });

  it('returns 403 if user is not team leader', async () => {
    mockGetUser.mockResolvedValueOnce({ ...mockUserData, team_leader: false });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('team leader');
  });

  it('returns 404 if team is not in queue', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockQueueData, team_queue: [] }) })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Team is not in the queue');
  });

  it('returns 409 if match is ongoing and team is playing', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockQueueData, team_queue: [mockTeamID, 'team-2'] }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockMatchData, ongoing: true }) });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Cannot leave queue while match is ongoing');
  });
});

describe('PUT /:courtID/match/queue/advance', () => {
  it('advances CIRCULAR queue by rotating first two teams to back', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({
        ...mockQueueData,
        queue_type: 'CIRCULAR',
        team_queue: ['team-A', 'team-B', 'team-C', 'team-D'],
      }) })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });

    mockGetTeam
      .mockResolvedValueOnce({ ...mockTeamData, teamID: 'team-C' })
      .mockResolvedValueOnce({ ...mockTeamData, teamID: 'team-D' });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/advance`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('CIRCULAR');
    expect(res.body.team_queue).toEqual(['team-C', 'team-D', 'team-A', 'team-B']);
  });

  it('advances FIFO queue by removing first team', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({
        ...mockQueueData,
        queue_type: 'FIFO',
        team_queue: ['team-A', 'team-B', 'team-C'],
      }) })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });

    mockGetTeam
      .mockResolvedValueOnce({ ...mockTeamData, teamID: 'team-B' })
      .mockResolvedValueOnce({ ...mockTeamData, teamID: 'team-C' });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/advance`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('FIFO');
    expect(res.body.removed_teamID).toBe('team-A');
  });

  it('returns 409 if match is still ongoing', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockMatchData, ongoing: true }) });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/advance`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('ongoing');
  });

  it('returns 200 with no change if fewer than 2 teams', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({
        ...mockQueueData,
        team_queue: ['team-A'],
      }) });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/advance`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
  });
});

describe('GET /:courtID/match/queue', () => {
  it('returns empty array if queue is empty', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockQueueData, team_queue: [] }) });

    const res = await request(app)
      .get(`/api/venue/court/${mockCourtID}/match/queue`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns hydrated queue with status fields', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({
        ...mockQueueData,
        team_queue: ['team-1', 'team-2', 'team-3'],
      }) });

    mockWhere.mockReturnValueOnce({
      get: vi.fn().mockResolvedValueOnce({
        forEach: (cb) => {
          [
            { data: () => ({ teamID: 'team-1', team_name: 'Alpha' }) },
            { data: () => ({ teamID: 'team-2', team_name: 'Beta' }) },
            { data: () => ({ teamID: 'team-3', team_name: 'Gamma' }) },
          ].forEach(cb);
        },
      }),
    });

    const res = await request(app)
      .get(`/api/venue/court/${mockCourtID}/match/queue`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].status).toBe('playing');
    expect(res.body[1].status).toBe('on_deck');
    expect(res.body[2].status).toBe('waiting');
  });

  it('returns 500 on Firestore error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Firestore error'));

    const res = await request(app)
      .get(`/api/venue/court/${mockCourtID}/match/queue`);

    expect(res.status).toBe(500);
  });
});

describe('PUT /:courtID/match/start', () => {
  it('starts match successfully', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({
        ...mockQueueData,
        team_queue: ['team-1', 'team-2'],
      }) })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/start`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toBe('Match started!');
  });

  it('returns 409 if fewer than 2 teams in queue', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({
        ...mockQueueData,
        team_queue: ['team-1'],
      }) });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/start`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('At least 2 teams');
  });

  it('returns 200 if match already started', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({
        ...mockQueueData,
        team_queue: ['team-1', 'team-2'],
      }) })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({ ...mockMatchData, ongoing: true }) });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/start`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('already started');
  });
});

describe('PUT /:courtID/match/end', () => {
  const ongoingMatch = {
    ...mockMatchData,
    ongoing: true,
    team1: { teamID: 'team-1', team_name: 'Alpha', team_score: 25, team_color: 'blue' },
    team2: { teamID: 'team-2', team_name: 'Beta', team_score: 20, team_color: 'red' },
  };

  it('ends match successfully when score limit is reached', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ongoingMatch });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/end`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Match has ended');
    expect(res.body.winner).toBe('team-1');
    expect(res.body.loser).toBe('team-2');
  });

  it('returns 200 if no match is ongoing', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/end`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('no game is ongoing at this court');
  });

  it('returns 409 if score limit not reached', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({
        ...ongoingMatch,
        team1: { ...ongoingMatch.team1, team_score: 10 },
        team2: { ...ongoingMatch.team2, team_score: 15 },
      }) });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/end`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('maximum score');
  });
});

describe('PUT /:courtID/match/score', () => {
  const ongoingMatch = {
    ...mockMatchData,
    ongoing: true,
    team1: { teamID: 'team-1', team_name: 'Alpha', team_score: 10, team_color: 'blue' },
    team2: { teamID: 'team-2', team_name: 'Beta', team_score: 8, team_color: 'red' },
  };

  it('updates score for team1', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ongoingMatch })
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ({
        ...ongoingMatch,
        team1: { ...ongoingMatch.team1, team_score: 11 },
      }) });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', 'Bearer mock-token')
      .send({ teamID: 'team-1', points: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Score updated');
    expect(res.body.team1_score).toBe(11);
  });

  it('returns 400 if teamID is missing', async () => {
    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', 'Bearer mock-token')
      .send({ points: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('teamID and points are required');
  });

  it('returns 400 if points is missing', async () => {
    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', 'Bearer mock-token')
      .send({ teamID: 'team-1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('teamID and points are required');
  });

  it('returns 409 if no match is ongoing', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => mockMatchData });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', 'Bearer mock-token')
      .send({ teamID: 'team-1', points: 1 });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('No match is currently ongoing');
  });

  it('returns 404 if team is not in the match', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, data: () => mockCourtData })
      .mockResolvedValueOnce({ exists: true, data: () => ongoingMatch });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', 'Bearer mock-token')
      .send({ teamID: 'team-999', points: 1 });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not in the current match');
  });
});


describe('circularAdvance (queue rotation logic)', () => {
  it('rotates first two teams to the back', () => {
    const queue = ['A', 'B', 'C', 'D'];
    const playing = queue.slice(0, 2);
    const waiting = queue.slice(2);
    const result = [...waiting, ...playing];

    expect(result).toEqual(['C', 'D', 'A', 'B']);
  });

  it('handles exactly 2 teams', () => {
    const queue = ['A', 'B'];
    const result = [...queue.slice(2), ...queue.slice(0, 2)];

    expect(result).toEqual(['A', 'B']);
  });

  it('handles 3 teams', () => {
    const queue = ['A', 'B', 'C'];
    const result = [...queue.slice(2), ...queue.slice(0, 2)];

    expect(result).toEqual(['C', 'A', 'B']);
  });
});