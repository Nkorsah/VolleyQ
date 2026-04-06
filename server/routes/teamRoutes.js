import express from 'express';
import { db, admin } from '../firebase.js';
import { userAuthInfo } from './userRoutes.js';

const router = express.Router();

//if you see a const uid = '1234567' we gotta replace that with actual auth

// can only join one team at a time.
router.post('/create-team', async (req, res) => {
  console.log('/api/create-team called...');
  try {
    const { name , id } = req.body; // team name

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'name is required' });
    }

     const userfirebaseDetails = await userAuthInfo(req.headers.authorization);
    
        if (!userfirebaseDetails) {
          return res.status(401).json({ message: "Unauthorized or invalid token" });
        }
    
        if (!name) {
          return res.status(400).json({ message: "Missing required fields" });
        }

    const uid = userfirebaseDetails.user_id;
    console.log('grabbing collection');
    // const teamRef = db.collection('teams').doc();

    const team_settings = {

    }
    
    const team = {
      id: id,
      name,
      ownerId: uid,
      memberIds: [uid],
      createdAt: new Date().toISOString(),
    };

    await db.collection('teams').doc(team.id).set(team);
    await db.collection('users').doc(uid).set({ current_teamID: team.id }, { merge: true });

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
       const userfirebaseDetails = await userAuthInfo(req.headers.authorization);
    
        if (!userfirebaseDetails) {
          return res.status(401).json({ message: "Unauthorized or invalid token" });
        }
    
        if (!name) {
          return res.status(400).json({ message: "Missing required fields" });
        }

    const uid = userfirebaseDetails.user_id;

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

//
router.get('/team/:id', async (req, res) => {
  console.log('/api/teams called...');
  try {
       const userfirebaseDetails = await userAuthInfo(req.headers.authorization);
    
        if (!userfirebaseDetails) {
          return res.status(401).json({ message: "Unauthorized or invalid token" });
        }
    
        if (!name) {
          return res.status(400).json({ message: "Missing required fields" });
        }

    const uid = userfirebaseDetails.user_id;

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
    const uid = '12'; //user id

    const teamRef = db.collection('teams').doc(teamId); // grabbing the team doc
    const teamSnap = await teamRef.get(); // getting a snapshot of the specific team entity

    if (!teamSnap.exists) {
      return res.status(404).json({ message: 'Team not found' });
    }


    await teamRef.update({ // updating the field 
      memberIds: admin.firestore.FieldValue.arrayUnion(uid),
    });

    // need to check if user exists. 
    await db.collection('users').doc(uid).set({ // adding team to the user entity
      teamIds: admin.firestore.FieldValue.arrayUnion(teamId),
    }, { merge: true });

    const updated = await teamRef.get();
    res.status(200).json({ id: updated.id, ...updated.data() });
    // don't know what's going on here is it changing the id? 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/team/update/:teamId', async (req, res) => {

  const userfirebaseDetails = await userAuthInfo(req.headers.authorization);

  // get the user's id and see if it matches the teams id
  // update the following fields and use the same logic as the user/update call

  if (!userfirebaseDetails) {
    return res.status(401).json({ message: "Unauthorized or invalid token" });
  }

  console.log("grabbing user id from token..")
  const userID = userfirebaseDetails.user_id;

  const allowedFields = ["name", "avatarUrl"];

  // updating allowed fields from body
  const update = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      update[key] = req.body[key];
    }
  }

  // verifying invalid fields 
  const receivedFields = Object.keys(req.body);

  const invalidFields = receivedFields.filter(
    (key) => !allowedFields.includes(key)
  );

  if (invalidFields.length > 0) {
    console.warn("Unexpected update fields!:", invalidFields);
  }


    // after parsing the update input. 

    console.log(`here's the update: ${JSON.stringify(update)}`)
    const userRef = db.collection("users").doc(userID);

    const updateInfo = await userRef.update(update) //
    console.log("updateInfo")
  
    const docSnap = await userRef.get();

    console.log("User updated successfully:", docSnap.data());
    res.status(200).json(docSnap.data());
})

router.delete('/team/delete', async (req, res) => {

  const { teamId } = req.params;
  console.log(`/api/delete-team/${teamId} called...`);
  try {
    const uid = '1234567';

    const teamRef = db.collection('teams').doc(teamId);
    const teamSnap = await teamRef.get();

    if (!teamSnap.exists) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const team = teamSnap.data(); // team reference
    console.log(teamSnap.data)

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

export default router;