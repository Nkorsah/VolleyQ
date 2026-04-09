// tests/team.test.js
import request from 'supertest';
import app from '../server.js';
import { db } from '../firebase.js';

const TEST_USER_1_ID = 'test-user-1';
const TEST_USER_2_ID = 'test-user-2';

const authHeader1 = `Bearer test ${TEST_USER_1_ID}`;
const authHeader2 = `Bearer test ${TEST_USER_2_ID}`;

describe('Team Routes', () => {
  let teamID;

  // Cleanup test users and team after all tests
  afterAll(async () => {
    try {
      await db.collection('users').doc(TEST_USER_1_ID).delete();
      await db.collection('users').doc(TEST_USER_2_ID).delete();
      if (teamID) {
        await db.collection('teams').doc(teamID).delete();
      }
    } catch (err) {
      console.error('Cleanup failed:', err.message);
    }
  });

  test('POST /api/create-user should create test users', async () => {
    const res1 = await request(app)
      .post('/api/create-user')
      .set('Authorization', authHeader1)
      .send({ name: 'Alice', email: 'alice@example.com' });
    expect(res1.statusCode).toBe(200);

    const res2 = await request(app)
      .post('/api/create-user')
      .set('Authorization', authHeader2)
      .send({ name: 'Bob', email: 'bob@example.com' });
    expect(res2.statusCode).toBe(200);
  });

  test('POST /api/create-team should create a team with user1 as leader', async () => {
    const res = await request(app)
      .post('/api/create-team')
      .set('Authorization', authHeader1)
      .send({ team_name: 'Champions', team_settings: { number_of_players: 4 } });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('teamID');
    expect(res.body.team_name).toBe('Champions');
    expect(res.body.members[0].userID).toBe(TEST_USER_1_ID);
    expect(res.body.members[0].team_leader).toBe(true);

    teamID = res.body.teamID;
  });

  test('PUT /api/join-team/:id should let user2 join the team', async () => {
    const res = await request(app)
      .put(`/api/join-team/${teamID}`)
      .set('Authorization', authHeader2);

    expect(res.statusCode).toBe(200);
    expect(res.body.team.members).toEqual(
      expect.arrayContaining([{ userID: TEST_USER_2_ID, team_leader: false }])
    );
  });

  test('PATCH /api/update-stats/:id should update team stats', async () => {
    const res = await request(app)
      .patch(`/api/update-stats/${teamID}`)
      .send({ result: 'win' });

    expect(res.statusCode).toBe(200);
    expect(res.body.team_stats.wins).toBeGreaterThanOrEqual(1);
  });

  test('PATCH /api/reset-stats/:id should reset team stats', async () => {
    const res = await request(app)
      .patch(`/api/reset-stats/${teamID}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.team_stats.wins).toBe(0);
    expect(res.body.team_stats.losses).toBe(0);
  });

  test('DELETE /api/leave-team/:id should remove user2 from the team', async () => {
    const res = await request(app)
      .delete(`/api/leave-team/${teamID}`)
      .set('Authorization', authHeader2);

    expect(res.statusCode).toBe(200);
    expect(res.body.team.members).not.toEqual(
      expect.arrayContaining([{ userID: TEST_USER_2_ID }])
    );
  });

  test('DELETE /api/team/delete should delete the team as leader', async () => {
    const res = await request(app)
      .delete('/api/team/delete')
      .set('Authorization', authHeader1);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/successfully deleted/i);

    const teamSnap = await db.collection('teams').doc(teamID).get();
    expect(teamSnap.exists).toBe(false);
  });
});