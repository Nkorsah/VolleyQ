import express from 'express';
const router = express.Router();
import { readFile } from 'fs/promises';

import { db } from '../firebase.js';

// Create New Team
router.post('/create-team', async (req, res) => {
  console.log("/api/create-team called...");

  try {
    const { id, name: team_name, members, createdAt, settings } = req.body;
    
    // temporary. Grab token from Uid
    const uid = "1234567"

    const teamJson = { // These are the fields that will be posted in firebase
      id,
      name: team_name,
      members: [uid],
      createdAt,
      settings,
      createdBy: [uid]
    };

    console.log(teamJson);

    await db.collection("teams").doc(id).set(teamJson); // posting team as the team entity in the database

    await db.collection("users").doc(uid).set({ // this updates the user entity with the specific team that they joined in firebase. 
  team: team_name
}, { merge: true });


    console.log("Team successfully created!");
    res.status(200).json({ message: "Team created" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Delete Team
router.delete('/delete-team/:teamId', async (req, res) => {
    const { teamId } = req.params;

    try {
        // TODO: Delete from Firebase

        await db.collection("teams").doc(teamId).delete();

        res.status(200).json({ message: `Team ${teamId} deleted` });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// User Joins team
router.put('/join-team/:teamId', async (req, res) => {
    const { teamId } = req.params;

    try {
        // TODO: Update Firebase team entry


        res.status(200).json({ message: `Team ${teamId} updated` });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;