import express from 'express';
import { db, admin } from '../firebase.js';
import { userAuthInfo } from './userRoutes.js'

const router = express.Router();

//if you see a const uid = '1234567' we gotta replace that with actual auth
router.post('/create-team', async (req, res) => {
  console.log('/api/create-team called...');
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'name is required' });
    }

    const uid = '1234567';

    const teamRef = db.collection('teams').doc();
    const team = {
      id: teamRef.id,
      name,
      ownerId: uid,
      memberIds: [uid],
      createdAt: new Date().toISOString(),
      stats: {
        wins: 0,
        losses: 0,
      }
    };

    await teamRef.set(team);
    await db.collection('users').doc(uid).set({ teamIds: [teamRef.id] }, { merge: true });

    console.log('Team successfully created!', team);
    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.get('/teams', async (req, res) => {
  console.log('/api/teams called...');
  try {
    const uid = '1234567';

    const snap = await db.collection('teams')
      .where('memberIds', 'array-contains', uid)
      .get();

    const teams = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.put('/join-team/:teamId', async (req, res) => {
  const { teamId } = req.params;
  console.log(`/api/join-team/${teamId} called...`);
  try {
    const uid = '1234567';

    const teamRef = db.collection('teams').doc(teamId);
    const teamSnap = await teamRef.get();

    if (!teamSnap.exists) {
      return res.status(404).json({ message: 'Team not found' });
    }

    await teamRef.update({
      memberIds: admin.firestore.FieldValue.arrayUnion(uid),
    });
    await db.collection('users').doc(uid).set({
      teamIds: admin.firestore.FieldValue.arrayUnion(teamId),
    }, { merge: true });

    const updated = await teamRef.get();
    res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.delete('/delete-team/:teamId', async (req, res) => {
  const { teamId } = req.params;
  console.log(`/api/delete-team/${teamId} called...`);
  try {
    const uid = '1234567';

    const teamRef = db.collection('teams').doc(teamId);
    const teamSnap = await teamRef.get();

    if (!teamSnap.exists) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const team = teamSnap.data();

    if (team.ownerId !== uid) {
      return res.status(403).json({ message: 'Only the owner can delete a team' });
    }

    // Remove teamId from all members
    const batch = db.batch();
    team.memberIds.forEach(memberId => {
      const userRef = db.collection('users').doc(memberId);
      batch.update(userRef, {
        teamIds: admin.firestore.FieldValue.arrayRemove(teamId),
      });
    });
    batch.delete(teamRef);
    await batch.commit();

    res.status(200).json({ message: `Team ${teamId} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.patch('/update-stats/:teamId', async (req, res) =>{
  const { teamId } = req.params;
  const { result } = req.body;
  console.log(`api.update-stats/{${teamId} called...`);
  const userfirebaseDetails = await userAuthInfo(req.headers.authorization);
  if (!userfirebaseDetails){
    return res.status(401).json({ message: 'Unauthorized or invalid token'});
  }
  if (result !== 'win' && result !== 'loss'){
    return res.status(400).json({ message: 'result must be win or loss'});
  }
  try{
    const uid = '1234567';

    const teamRef = db.collection('teams').doc(teamId);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) {
     return res.status(404).json({ message: 'Team not found' });
    }

    const team = teamSnap.data();

    if (team.ownerId !== uid) {
      return res.status(403).json({ message: 'Only the owner can update stats' });
    }

    await teamRef.update({
      [`stats.${result}s`]: admin.firestore.FieldValue.increment(1),
    });

    const updated = await teamRef.get();
    res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}); 

router.patch('/reset-stats/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { results } = req.body;
  console.log(`api.reset-stats/{${teamId} called...`);
  const userfirebaseDetails = await userAuthInfo(req.headers.authorization);
  if (!userfirebaseDetails){
    return res.status(401).json({ message: 'Unauthorized or invalid token'});
  }

  if (result !== 'win' && result !== 'loss'){
    return res.status(400).json({ message: 'result must be win or loss'});
  }
  try{
    const uid = '1234567';

    const teamRef = db.collection('teams').doc(teamId);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) {
     return res.status(404).json({ message: 'Team not found' });
    }
    const team = teamSnap.data();

    if (team.ownerId !== uid) {
      return res.status(403).json({ message: 'Only the owner can update stats' });
    }

    await teamRef.update({ stats: {wins: 0, losses: 0} })
    const updated = await teamRef.get()
    res.status(200).json({ id: updated.id, ...updated.data() })
  } catch(err){
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;