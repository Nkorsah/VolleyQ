import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken'
// const admin = require('firebase-admin'); 

import { db } from '../firebase.js';

import admin from 'firebase-admin';

import { getDatabase, ref, set } from "firebase/database";
import { Timestamp } from 'firebase-admin/firestore';
import { stat } from 'fs';

router.post('/get-token', (req, res) => {
    const {user, password} = req.body
    
    const token = jwt.sign(user, password, {
        expiresIn: '1h'
    })

    res.status(200).json({
        token
    })
})

router.get('/verify-token', async (req,res) => { // 
    // const token = req.headers['authorization']?.split('')[1] || '';
    // const secret 
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    try {
        // console.log('decoding token....')
        const decodedToken = await admin.auth().verifyIdToken(idToken); // firebase 
        req.user = decodedToken; // Token is valid; user data is now available
        console.log(decodedToken)
        res.status(200).send('Authorized!')
        // next();
    } catch (error) {
        res.status(401).send('Unauthorized');
    }
})

export const userAuthInfo = async (authHeader) => {
  if (!authHeader) return null;
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.log('Unauthorized:', error);
    return null;
  }
};

router.post('/create-user', async (req, res) => {
  console.log("/api/create-user called");
  try {
    const { name, email, avatarUrl, createdAt, teamID, role, stats } = req.body;

    const userfirebaseDetails = await userAuthInfo(req.headers.authorization); // grabs token . decodes it. has information about user

    if (!userfirebaseDetails) {
      return res.status(401).json({ message: "Unauthorized or invalid token" });
    }

    if (!email || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payload = { // user entity being posted to database
      userID: userfirebaseDetails.user_id, // from decoded token
      name,
      email,
      avatarUrl: avatarUrl || null,
      createdAt: createdAt || new Date().toISOString(),
      role: role || "user",
      stats: stats || {},
    };

    if (teamID) payload.teamID = teamID;

    const docRef = db.collection("users").doc(payload.userID);

    await docRef.set(payload);
    console.log('created user entity in database!')

    // optional: verify the write
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      console.error("Document not created!");
      return res.status(500).json({ message: "Failed to create user in Firestore" });
    }

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
    console.log(req.headers.authorization)
    const userfirebaseDetails = await userAuthInfo(req.headers.authorization);
    const userID = userfirebaseDetails.user_id;
    console.log(`Getting user with ID ${userfirebaseDetails.email}`)

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

    res.status(200).json(userDoc.data());
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});




router.put('/user/update', async (req, res) => {
  console.log("/api/user/update called");
  try {
    // user must exist. 
    // const { name, email, avatarUrl, createdAt, teamID, role, stats } = req.body;

    const userfirebaseDetails = await userAuthInfo(req.headers.authorization); // grabs token . decodes it. has information about user

    if (!userfirebaseDetails) {
      return res.status(401).json({ message: "Unauthorized or invalid token" });
    }

    console.log("grabbing user id from token..")
    const userID = userfirebaseDetails.user_id;

    // grab the user by id. refrence 
    // update fields. 
    // i think that I need to verify that it is the right type. I'll do this for now though. 

    const allowedFields = ["name", "avatarUrl", "email"];

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
  
    // optional: verify the write
    const docSnap = await userRef.get();
    // if (!docSnap.exists) {
    //   console.error("Document not created!");
    //   return res.status(500).json({ message: "Failed to create user in Firestore" });
    // }

    console.log("User updated successfully:", docSnap.data());
    res.status(200).json(docSnap.data());

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});



router.delete('/user/delete', async (req, res) => {
  try {
    console.log(req.headers.authorization)
    const userfirebaseDetails = await userAuthInfo(req.headers.authorization);
    const userID = userfirebaseDetails.user_id;
    console.log(`Getting user ${userfirebaseDetails.user_id}`)

    await db.collection("users").doc(userID).delete();
    console.log(`user has been deleted!`)
    res.status(200).json(`user has been deleted!`);
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
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