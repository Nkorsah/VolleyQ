import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const {
  mockGet, mockSet, mockUpdate, mockDelete,
  mockWhere, mockDoc, mockCollection,
  mockBatch, mockBatchSet, mockBatchUpdate,
  mockBatchDelete, mockBatchCommit,
  mockArrayUnion, mockIncrement,
  mockGetUserID, mockGetUser, mockGetTeam,
  mockUpdateUser, mockUpdateMatch,
} = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockWhere: vi.fn(),
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
  mockUpdateMatch: vi.fn(),
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
    .mockReturnValueOnce('mock-queue-id')
    .mockReturnValue('mock-id'),
}));

vi.mock('../routes/teamRoutes.js', () => ({
  getUserID: mockGetUserID,
}));

vi.mock('../routes/helper functions/updateEntities.js', () => ({
  updateUser: mockUpdateUser,
  updateMatch: mockUpdateMatch,
  updateMatchScore: vi.fn(),
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
const mockToken = 'Bearer mock-token';

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
  skill_level: 'intermediate',
  team_settings: { team_color: 'blue' },
};

const mockUserData = {
  userID: mockUserID,
  teamID: mockTeamID,
  team_leader: true,
  name: 'Test User',
};


function makeSnap(exists, data) {
  return {
    exists,
    data: () => data,
    id: data?.courtID ?? data?.matchID ?? data?.queueID ?? 'mock-id',
  };
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
  mockSet.mockResolvedValue({});
  mockUpdate.mockResolvedValue({});
  mockDelete.mockResolvedValue({});
  mockDoc.mockReturnValue({
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    delete: mockDelete,
  });
  mockCollection.mockReturnValue({
    doc: mockDoc,
    where: mockWhere,
    get: mockGet,
  });
  mockWhere.mockReturnValue({ get: mockGet });
  mockArrayUnion.mockImplementation((...args) => args);
  mockIncrement.mockReturnValue('mock-increment');
  mockUpdateMatch.mockResolvedValue({});
}

function setupCourtChain(
  courtData = mockCourtData,
  queueData = mockQueueData,
  matchData = mockMatchData
) {
  mockGet
    .mockResolvedValueOnce(makeSnap(true, courtData))  
    .mockResolvedValueOnce(makeSnap(true, matchData)) 
    .mockResolvedValueOnce(makeSnap(true, courtData)) 
    .mockResolvedValueOnce(makeSnap(true, queueData));
}

beforeEach(() => {
  vi.clearAllMocks();
  setupFirestore();
  mockGetUserID.mockResolvedValue(mockUserID);
  mockGetUser.mockResolvedValue(mockUserData);
  mockGetTeam.mockResolvedValue(mockTeamData);
  mockUpdateUser.mockResolvedValue({ userID: mockUserID });
  mockUpdateMatch.mockResolvedValue({});
});

describe('POST /api/venue/court/create', () => {
  const validBody = {
    court_name: 'Court 1',
    max_teams_in_queue: 8,
    queue_type: 'CIRCULAR',
    score_limit: 25,
    venueID: 'venue-123',
  };

  it('creates court, match and queue on success', async () => {
    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', mockToken)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.court.court_settings.court_name).toBe('Court 1');
    expect(res.body.court.queue_length).toBe(0);
    expect(res.body.match.ongoing).toBe(false);
    expect(res.body.queue.team_queue).toEqual([]);
  });

  it('returns 400 if court_name is missing', async () => {
    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', mockToken)
      .send({ ...validBody, court_name: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing required fields');
  });

  it('returns 400 if venueID is missing', async () => {
    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', mockToken)
      .send({ ...validBody, venueID: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing required fields');
  });

  it('returns 400 if user update fails', async () => {
    mockUpdateUser.mockRejectedValueOnce(new Error('User update failed'));

    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', mockToken)
      .send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Failed to update user');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUserID.mockRejectedValueOnce(new Error('Auth error'));

    const res = await request(app)
      .post('/api/venue/court/create')
      .set('Authorization', mockToken)
      .send(validBody);

    expect(res.status).toBe(500);
  });
});

describe('PUT /:courtID/match/queue/join', () => {
  function setupJoinMocks(queueOverride = {}) {
    const queueData = { ...mockQueueData, ...queueOverride };
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, queueData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, queueData))
  }

  it('joins queue successfully for CIRCULAR queue', async () => {
    setupJoinMocks();
    mockUpdateMatch.mockResolvedValue({});

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Team Join success!');
    expect(res.body.team_queue).toContain(mockTeamID);
  });

  it('returns 400 if user has no team', async () => {
    mockGetUser.mockResolvedValueOnce({ ...mockUserData, teamID: null });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User is not on a team');
  });

  it('returns 403 if user is not team leader', async () => {
    mockGetUser.mockResolvedValueOnce({ ...mockUserData, team_leader: false });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('User is not a team leader');
  });

  it('returns 409 if team is already in queue', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, {
        ...mockQueueData,
        team_queue: [mockTeamID],
      }));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Team is already in the queue');
  });

  it('returns 409 if queue is full', async () => {
    const fullQueue = Array(8).fill(null).map((_, i) => `team-${i}`);
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: fullQueue }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Queue is full');
  });

  it('returns 400 for unknown queue type', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: [] }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, queue_type: 'UNKNOWN' }));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Unknown queue type');
  });

  it('adds skill_level entry for PRIORITY QUEUE', async () => {
    const priorityQueueData = { ...mockQueueData, queue_type: 'PRIORITY QUEUE', team_queue: [] };

    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, priorityQueueData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, priorityQueueData));

    mockUpdateMatch.mockResolvedValue({});

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/join`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body.team_queue[0]).toMatchObject({
      teamID: mockTeamID,
      skill_level: 'intermediate',
    });
  });
});


describe('PUT /:courtID/match/queue/leave', () => {
  it('removes team from CIRCULAR queue successfully', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: [mockTeamID, 'team-2'] }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Team left the queue successfully');
    expect(res.body.team_queue).not.toContain(mockTeamID);
  });

  it('returns 400 if user has no team', async () => {
    mockGetUser.mockResolvedValueOnce({ ...mockUserData, teamID: null });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User is not on a team');
  });

  it('returns 403 if user is not team leader', async () => {
    mockGetUser.mockResolvedValueOnce({ ...mockUserData, team_leader: false });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('team leader');
  });

  it('returns 404 if team is not in queue', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: [] }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Team is not in the queue');
  });

  it('returns 409 if match is ongoing and team is playing', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: [mockTeamID, 'team-2'] }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockMatchData, ongoing: true }));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Cannot leave queue while match is ongoing');
  });

  it('removes team from PRIORITY QUEUE successfully', async () => {
    const priorityEntry = { teamID: mockTeamID, skill_level: 'intermediate', joinedAt: '2024-01-01' };
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, {
        ...mockQueueData,
        queue_type: 'PRIORITY QUEUE',
        team_queue: [priorityEntry],
      }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/leave`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body.team_queue).toEqual([]);
  });
});


describe('PUT /:courtID/match/queue/advance', () => {
  it('advances CIRCULAR queue by rotating first two to back', async () => {
    const queue = ['team-A', 'team-B', 'team-C', 'team-D'];
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: queue }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: ['team-C', 'team-D', 'team-A', 'team-B'] }));

    mockGetTeam
      .mockResolvedValueOnce({ ...mockTeamData, teamID: 'team-C', team_name: 'Team C' })
      .mockResolvedValueOnce({ ...mockTeamData, teamID: 'team-D', team_name: 'Team D' });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/advance`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('CIRCULAR');
    expect(res.body.team_queue).toEqual(['team-C', 'team-D', 'team-A', 'team-B']);
  });

  it('advances FIFO queue by removing first team', async () => {
    const queue = ['team-A', 'team-B', 'team-C'];
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, queue_type: 'FIFO', team_queue: queue }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: ['team-B', 'team-C'] }));

    mockGetTeam
      .mockResolvedValueOnce({ ...mockTeamData, teamID: 'team-B', team_name: 'Team B' })
      .mockResolvedValueOnce({ ...mockTeamData, teamID: 'team-C', team_name: 'Team C' });

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/advance`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('FIFO');
    expect(res.body.removed_teamID).toBe('team-A');
    expect(res.body.team_queue).not.toContain('team-A');
  });

  it('returns 409 if match is ongoing', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockMatchData, ongoing: true }));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/advance`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('ongoing');
  });

  it('returns 200 with no change if fewer than 2 teams', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: ['team-A'] }));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/queue/advance`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('at least 2');
  });
});

describe('GET /:courtID/match/queue', () => {
  it('returns empty array if queue is empty', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockQueueData));

    const res = await request(app)
      .get(`/api/venue/court/${mockCourtID}/match/queue`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns hydrated queue with status fields', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, {
        ...mockQueueData,
        team_queue: ['team-1', 'team-2', 'team-3'],
      }));

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

  it('returns sorted priority queue', async () => {
    const priorityQueue = [
      { teamID: 'team-pro', skill_level: 'professional', joinedAt: '2024-01-01T00:00:00Z' },
      { teamID: 'team-basic', skill_level: 'basic', joinedAt: '2024-01-01T00:01:00Z' },
      { teamID: 'team-inter', skill_level: 'intermediate', joinedAt: '2024-01-01T00:02:00Z' },
    ];

    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, {
        ...mockQueueData,
        queue_type: 'PRIORITY QUEUE',
        team_queue: priorityQueue,
      }));

    mockWhere.mockReturnValueOnce({
      get: vi.fn().mockResolvedValueOnce({
        forEach: (cb) => {
          [
            { data: () => ({ teamID: 'team-pro', team_name: 'Pro Team' }) },
            { data: () => ({ teamID: 'team-basic', team_name: 'Basic Team' }) },
            { data: () => ({ teamID: 'team-inter', team_name: 'Inter Team' }) },
          ].forEach(cb);
        },
      }),
    });

    const res = await request(app)
      .get(`/api/venue/court/${mockCourtID}/match/queue`);

    expect(res.status).toBe(200);
    expect(res.body[0].teamID).toBe('team-basic');
    expect(res.body[1].teamID).toBe('team-inter');
    expect(res.body[2].teamID).toBe('team-pro');
  });
});

describe('PUT /:courtID/match/start', () => {
  it('starts match successfully', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: ['team-1', 'team-2'] }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/start`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body).toBe('Match started!');
  });

  it('returns 409 if fewer than 2 teams', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: ['team-1'] }));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/start`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('At least 2 teams');
  });

  it('returns 200 if match already started', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockQueueData, team_queue: ['team-1', 'team-2'] }))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, { ...mockMatchData, ongoing: true }));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/start`)
      .set('Authorization', mockToken);

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

  it('ends match and returns winner and loser', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, ongoingMatch));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/end`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Match has ended');
    expect(res.body.winner).toBe('team-1');
    expect(res.body.loser).toBe('team-2');
  });

  it('returns 200 if no match is ongoing', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/end`)
      .set('Authorization', mockToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('no game is ongoing');
  });

  it('returns 409 if score limit not reached', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, {
        ...ongoingMatch,
        team1: { ...ongoingMatch.team1, team_score: 10 },
        team2: { ...ongoingMatch.team2, team_score: 8 },
      }));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/end`)
      .set('Authorization', mockToken);

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
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, ongoingMatch))
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, {
        ...ongoingMatch,
        team1: { ...ongoingMatch.team1, team_score: 11 },
      }));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', mockToken)
      .send({ teamID: 'team-1', points: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Score updated');
    expect(res.body.team1_score).toBe(11);
  });

  it('returns 400 if teamID is missing', async () => {
    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', mockToken)
      .send({ points: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('teamID and points are required');
  });

  it('returns 400 if points is missing', async () => {
    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', mockToken)
      .send({ teamID: 'team-1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('teamID and points are required');
  });

  it('returns 409 if no match is ongoing', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, mockMatchData));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', mockToken)
      .send({ teamID: 'team-1', points: 1 });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('No match is currently ongoing');
  });

  it('returns 404 if team is not in match', async () => {
    mockGet
      .mockResolvedValueOnce(makeSnap(true, mockCourtData))
      .mockResolvedValueOnce(makeSnap(true, ongoingMatch));

    const res = await request(app)
      .put(`/api/venue/court/${mockCourtID}/match/score`)
      .set('Authorization', mockToken)
      .send({ teamID: 'team-999', points: 1 });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not in the current match');
  });
});

describe('GET /courts', () => {
  it('returns courts for a venue', async () => {
    mockWhere.mockReturnValueOnce({
      get: vi.fn().mockResolvedValueOnce({
        docs: [
          { id: mockCourtID, data: () => mockCourtData },
        ],
      }),
    });

    const res = await request(app)
      .get('/api/venue/court/courts')
      .query({ venueID: 'venue-123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].courtID).toBe(mockCourtID);
  });

  it('returns 400 if venueID is missing', async () => {
    const res = await request(app)
      .get('/api/venue/court/courts');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('venueID is required');
  });

  it('returns empty array if no courts found', async () => {
    mockWhere.mockReturnValueOnce({
      get: vi.fn().mockResolvedValueOnce({ docs: [] }),
    });

    const res = await request(app)
      .get('/api/venue/court/courts')
      .query({ venueID: 'venue-123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on Firestore error', async () => {
    mockWhere.mockReturnValueOnce({
      get: vi.fn().mockRejectedValueOnce(new Error('Firestore error')),
    });

    const res = await request(app)
      .get('/api/venue/court/courts')
      .query({ venueID: 'venue-123' });

    expect(res.status).toBe(500);
  });
});

describe('circularAdvance logic', () => {
  const rotate = (queue) => {
    const playing = queue.slice(0, 2);
    const waiting = queue.slice(2);
    return [...waiting, ...playing];
  };

  it('rotates 4 teams correctly', () => {
    expect(rotate(['A', 'B', 'C', 'D'])).toEqual(['C', 'D', 'A', 'B']);
  });

  it('handles exactly 2 teams', () => {
    expect(rotate(['A', 'B'])).toEqual(['A', 'B']);
  });

  it('handles 3 teams', () => {
    expect(rotate(['A', 'B', 'C'])).toEqual(['C', 'A', 'B']);
  });

  it('handles 5 teams', () => {
    expect(rotate(['A', 'B', 'C', 'D', 'E'])).toEqual(['C', 'D', 'E', 'A', 'B']);
  });
});


describe('prioritySort logic', () => {
  const SKILL_PRIORITY = { basic: 1, intermediate: 2, professional: 3 };

  const sort = (entries) => [...entries].sort((a, b) => {
    const diff = (SKILL_PRIORITY[a.skill_level] ?? 99) - (SKILL_PRIORITY[b.skill_level] ?? 99);
    if (diff !== 0) return diff;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  it('sorts basic before intermediate before professional', () => {
    const entries = [
      { teamID: 'pro', skill_level: 'professional', joinedAt: '2024-01-01T00:00Z' },
      { teamID: 'basic', skill_level: 'basic', joinedAt: '2024-01-01T00:01Z' },
      { teamID: 'inter', skill_level: 'intermediate', joinedAt: '2024-01-01T00:02Z' },
    ];
    const sorted = sort(entries);
    expect(sorted[0].teamID).toBe('basic');
    expect(sorted[1].teamID).toBe('inter');
    expect(sorted[2].teamID).toBe('pro');
  });

  it('uses joinedAt as tiebreaker within same skill level', () => {
    const entries = [
      { teamID: 'late', skill_level: 'basic', joinedAt: '2024-01-01T00:02Z' },
      { teamID: 'early', skill_level: 'basic', joinedAt: '2024-01-01T00:01Z' },
    ];
    const sorted = sort(entries);
    expect(sorted[0].teamID).toBe('early');
    expect(sorted[1].teamID).toBe('late');
  });
});