// tests/user.test.js
import request from 'supertest';
import app from '../server.js'; // import your Express app
import { db } from '../firebase.js';

// Mock the auth header
const TEST_USER_ID = 'test-user-123';

const authHeader = `Bearer test ${TEST_USER_ID}`;

describe('User Routes', () => {
  let createdUserID;

  // Clean up before/after tests if needed
  afterAll(async () => {
    // Delete the test user if it exists
    try {
      await db.collection('users').doc(TEST_USER_ID).delete();
    } catch (err) {
      console.error('Cleanup failed:', err.message);
    }
  });

  test('POST /api/create-user should create a new user', async () => {
    const res = await request(app)
      .post('/api/create-user')
      .set('Authorization', authHeader)
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('userID', TEST_USER_ID);
    expect(res.body.data).toHaveProperty('name', 'Test User');

    createdUserID = res.body.data.userID;
  });

  test('GET /api/user should return the current user', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('userID', TEST_USER_ID);
    expect(res.body).toHaveProperty('name', 'Test User');
  });

  test('PUT /api/user/update should update user fields', async () => {
    const res = await request(app)
      .put('/api/user/update')
      .set('Authorization', authHeader)
      .send({ name: 'Updated Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Name');
  });

  test('DELETE /api/user/delete should remove the user', async () => {
    const res = await request(app)
      .delete('/api/user/delete')
      .set('Authorization', authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatch(/user has been deleted/i);

    const userSnap = await db.collection('users').doc(TEST_USER_ID).get();
    expect(userSnap.exists).toBe(false);
  });
});