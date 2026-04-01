import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function createUserInDb(db: any, userId: string, overrides = {}) {
  await setDoc(doc(db, 'users', userId), {
    name: 'Test User',
    email: `${userId}@test.com`,
    teamIds: [],
    ...overrides,
  });
}

export async function createTeamInDb(db: any, teamId: string, overrides = {}) {
  await setDoc(doc(db, 'teams', teamId), {
    name: 'Test Team',
    ownerId: 'owner-uid',
    memberIds: ['owner-uid'],
    createdAt: serverTimestamp(),
    ...overrides,
  });
}