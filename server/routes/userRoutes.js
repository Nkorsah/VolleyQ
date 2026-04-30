import express from 'express';
import { db } from '../firebase.js';
import { getDatabase, ref, set } from "firebase/database";
import { calculateTeamSkillLevel } from './helper functions/skillLevel.js';
import { getUserID } from './teamRoutes.js';
import { Timestamp } from 'firebase-admin/firestore';
import { stat } from 'fs';
import { updateUser, strictValidateUpdate } from './helper functions/updateEntities.js';
import admin from 'firebase-admin';
const router = express.Router();
import jwt from 'jsonwebtoken'
// const admin = require('firebase-admin'); 









// router.post('/get-token', (req, res) => {
//     const {user, password} = req.body
    
//     const token = jwt.sign(user, password, {
//         expiresIn: '1h'
//     })

//     res.status(200).json({
//         token
//     })
// })

// router.get('/verify-token', async (req,res) => { // 
//     // const token = req.headers['authorization']?.split('')[1] || '';
//     // const secret 
//     const idToken = req.headers.authorization?.split('Bearer ')[1];
//     try {
//         // console.log('decoding token....')
//         const decodedToken = await admin.auth().verifyIdToken(idToken); // firebase 
//         req.user = decodedToken; // Token is valid; user data is now available
//         console.log(decodedToken)
//         res.status(200).send('Authorized!')
//         // next();
//     } catch (error) {
//         res.status(401).send('Unauthorized');
//     }
// })

// Authenticates the user and decrypts the auth header token
// if you want to bypass, use "Authorization: Bearer test 12345" header
export const userAuthInfo = async (authHeader) => {
  if (!authHeader) {
    console.log("No auth header provided");
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts[0] !== 'Bearer') {
    console.log("Invalid auth header format:", authHeader);
    return null;
  }

  // 🔹 CASE 1: test mode → "Bearer test 12345"
  if (parts[1] === 'test') {
    const fakeID = parts[2];
    console.log(`Using test user id: ${fakeID}`);
    return fakeID || null;
  }

  // 🔹 CASE 2: real token → "Bearer <token>"
  if (parts.length !== 2) {
    console.log("Invalid token format:", authHeader);
    return null;
  }

  const idToken = parts[1];
  console.log(`token is: ${idToken}`);

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid; // always return userID
  } catch (error) {
    console.log('Unauthorized:', error.message);
    return null;
  }
};

router.post('/create-user', async (req, res) => {
  console.log("/api/create-user called");
  try {
    // no longer need to send stats, teamID, or createdAt from the frontend. Backend handles this.
    const { name, email } = req.body;

    const userID = await getUserID(req.headers.authorization);

    if (!email || !name) { // random error handling. 
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user_stats = {
      "games_played": 0,
      "wins": 0,
      "losses": 0
    }

    // creating the user object
    const payload = { // user entity being posted to database
      userID, // from decoded token
      name,
      email,
      avatarUrl: "https://i.pravatar.cc/40?img=58",
      hosted_courtID: null, // role changes the frontend pages
      team_leader: false, 
      venue_creator: false,
      teamID: null,
      team_name: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      stats: user_stats,
    };

    // if (teamID) payload.teamID = teamID;

    const docRef = db.collection("users").doc(payload.userID);

    await docRef.set(payload);
    console.log('created user entity in database!')

    // optional: verify the write
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      console.error("Document not created!");
      return res.status(500).json({ message: "Failed to create user in Firestore" });
    }

    // return the user object for the frontend. 
    console.log("User created successfully:", docSnap.data());
    res.status(200).json({ message: "New user created", data: docSnap.data() });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// Get Current User
router.get('/user', async (req, res) => {
  try {
    const userID = await getUserID(req.headers.authorization);
    console.log(`Getting user with ID ${userID}`)

    const userDoc = await db.collection("users").doc(userID).get();
    console.log(`Sending user entity ${userDoc.data}`)

    res.status(200).json(userDoc.data());
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params; // user id

    const userDoc = await db.collection("users").doc(id).get();
    
    //send error when id isn't correct. 

    res.status(200).json(userDoc.data());
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// update current user. If I change the name, update the team entitiy too! 
router.put('/user/update', async (req, res) => {
  
  console.log("/api/user/update called");
  try {
    const userID = await getUserID(req.headers.authorization);
    console.log(`userid is: ${userID}`);

    // const allowedFields = ["name", "avatarUrl", "email"]; // specify the allowed fields to be updated
    const updatedUser = await updateUser(userID, req.body);

    if (!updatedUser) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    console.log("User updated successfully:", updatedUser);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// router.put('/user/update/stats', async (req, res) => { 
//   console.log("/api/user/update/stats called");
//   try {
//     // Get userID from the auth token
//     const userID = await getUserID(req.headers.authorization);
//     if (!userID) {
//       return res.status(401).json({ message: "Unauthorized or invalid token" });
//     }

//     // Only allow the 'stats' field to be updated
//     const allowedFields = ["stats"];
// // 'gamesPlayed', 'wins', 'losses'
//     // Use helper to update user
//     const updatedUser = await updateUser(userID, req.body, allowedFields);

//     if (!updatedUser) {
//       return res.status(400).json({ message: "No valid fields to update" });
//     }

//     console.log("User stats updated successfully:", updatedUser);
//     res.status(200).json(updatedUser);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal Server Error", error: err.message });
//   }
// });
// I'll also have to update user by ID too. 

router.put('/user/update/:id', async (req, res) => {
   
  console.log("/api/user/update/:id called");
  try {
    const userID = req.params.id // see if id is vald
    console.log(`userid is: ${userID}`);

    const allowedFields = ["name", "avatarUrl", "email"]; // specify the allowed fields to be updated
    // code that updates user
    const updatedUser = await updateUser(userID, req.body, allowedFields);

    if (!updatedUser) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    console.log("User updated successfully:", updatedUser);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});




router.delete('/user/delete', async (req, res) => {
  try {
   const userID = await getUserID(req.headers.authorization);

    await db.collection("users").doc(userID).delete();
    console.log(`user has been deleted!`)
    res.status(200).json(`user has been deleted!`);
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.put('/settings/skill', async (req, res) => {
  console.log('/api/user/settings/skill called...');
  try {
    const { skill_level } = req.body;

    const valid = ['Beginner', 'Intermediate', 'Advanced'];
    if (!valid.includes(skill_level)) {
      return res.status(400).json({ message: 'skill_level must be Beginner, Intermediate, and Advanced' });
    }

    const userID = await getUserID(req.headers.authorization);

    await db.collection('users').doc(userID).update({ skill_level });
    console.log(`User ${userID} skill level set to ${skill_level}`);

    // recalc team overall skill level when user joins/leaves
    const teamsSnap = await db.collection('teams')
      .where('memberIds', 'array-contains', userID)
      .get();

    if (!teamsSnap.empty) {
      const batch = db.batch();

      await Promise.all(
        teamsSnap.docs.map(async teamDoc => {
          const { skill_level: new_skill, skill_score } =
            await calculateTeamSkillLevel(teamDoc.id, db);

          batch.update(db.collection('teams').doc(teamDoc.id), {
            skill_level: new_skill,
            skill_score,
          });

          console.log(`Team ${teamDoc.id} skill recalculated → ${new_skill} (${skill_score})`);
        })
      );

      await batch.commit();
    }

    return res.status(200).json({
      message: 'Skill level updated',
      skill_level,
      teams_updated: teamsSnap.size,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/settings', async (req, res) => {
  console.log('/api/user/settings called...');
  try {
    const userID = await getUserID(req.headers.authorization);
    const userSnap = await db.collection('users').doc(userID).get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { skill_level, name, email, avatarUrl } = userSnap.data();

    return res.status(200).json({ skill_level: skill_level ?? 'Beginner', name, email, avatarUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});





//
// Update User
// router.put('/user/:userId', (req, res) => {
//     const { userId } = req.params;

//     try {
//         // TODO: Update Firebase
//         res.status(200).json({ message: `User ${userId} updated` });
//     } catch (err) {
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// });



export default router;