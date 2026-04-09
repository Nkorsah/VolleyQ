import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockGenerateContent = vi.fn();

vi.mock('../firebase.js', () => ({
  db: {
    collection: mockCollection,
  },
}));

vi.mock('../gemini.js', () => ({
  default: {
    model: {
      generateContent: mockGenerateContent,
    },
  },
}));

const { default: teamRouter } = await import('../routes/teamRoutes.js');

const app = express();
app.use(express.json());
app.use('/api', teamRouter);

const mockTeam = {
  id: 'team-1',
  name: 'Engineering',
  ownerId: '1234567',
  memberIds: ['1234567', 'user-2'],
  stats: { wins: 10, losses: 3 },
  createdAt: '2024-01-01T00:00:00.000Z',
};

function setupFirestoreMock(exists, data = {}) {
  mockGet.mockResolvedValue({ exists, data: () => data });
  mockUpdate.mockResolvedValue({});
  mockDoc.mockReturnValue({ get: mockGet, update: mockUpdate });
  mockCollection.mockReturnValue({ doc: mockDoc });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/analyze-team/:teamId', () => {
  it('returns a 200 with analysis on success', async () => {
    setupFirestoreMock(true, mockTeam);
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Great performance overall!' },
    });

    const res = await request(app).post('/api/analyze-team/team-1');

    console.log('Status:', res.status);
    console.log('Body:', res.body);
    console.log('mockCollection called:', mockCollection.mock.calls);
    console.log('mockDoc called:', mockDoc.mock.calls);
    console.log('mockGet called:', mockGet.mock.calls);
    console.log('mockGenerateContent called:', mockGenerateContent.mock.calls);

    expect(res.status).toBe(200);
    expect(res.body.analysis).toBe('Great performance overall!');
  });

  it('calls Gemini with the correct team stats in the prompt', async () => {
    setupFirestoreMock(true, mockTeam);
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Analysis here' },
    });

    await request(app).post('/api/analyze-team/team-1');

    const prompt = mockGenerateContent.mock.calls[0][0];
    expect(prompt).toContain('Engineering');
    expect(prompt).toContain('10');
    expect(prompt).toContain('3');
  });

  it('returns 404 if team does not exist', async () => {
    setupFirestoreMock(false);

    const res = await request(app).post('/api/analyze-team/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Team not found');
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('returns 500 if Gemini fails', async () => {
    setupFirestoreMock(true, mockTeam);
    mockGenerateContent.mockRejectedValue(new Error('Gemini API error'));

    const res = await request(app).post('/api/analyze-team/team-1');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });

  it('returns 500 if Firestore fails', async () => {
    mockGet.mockRejectedValue(new Error('Firestore error'));
    mockDoc.mockReturnValue({ get: mockGet });
    mockCollection.mockReturnValue({ doc: mockDoc });

    const res = await request(app).post('/api/analyze-team/team-1');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });

  it('calculates the correct win rate in the prompt', async () => {
    setupFirestoreMock(true, { ...mockTeam, stats: { wins: 5, losses: 5 } });
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Analysis' },
    });

    await request(app).post('/api/analyze-team/team-1');

    const prompt = mockGenerateContent.mock.calls[0][0];
    expect(prompt).toContain('50.0%');
  });

  it('handles a team with no games played', async () => {
    setupFirestoreMock(true, { ...mockTeam, stats: { wins: 0, losses: 0 } });
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'No games yet' },
    });

    await request(app).post('/api/analyze-team/team-1');

    const prompt = mockGenerateContent.mock.calls[0][0];
    expect(prompt).toContain('0%');
  });
});