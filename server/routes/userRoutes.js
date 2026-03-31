import express from 'express';
const router = express.Router();
// const admin = require('firebase-admin'); 

import { db } from '../firebase.js';

import admin from 'firebase-admin';
import { getDatabase, ref, set } from "firebase/database";
import { Timestamp } from 'firebase-admin/firestore';
import { stat } from 'fs';

// Add New User
router.post('/user-create', (req, res) => { //
  
    // if (!username || !password || !email) {
    //     return res.status(400).json({ message: 'Invalid username/password' });
    // }
    console.log("/api/user-create has been called! Attempting to create user...")
    try { 
        const { userID, name, email, avatarUrl, createdAt, teamID, role, stats } = req.body; // data that comes from the frontend

        const userJson = { // Creating the fields for the user
            userID: userID,
            name: name,
            email: email,
            avatarUrl: avatarUrl,
            createdAt: createdAt,
            role: role,
            stats: stats,
        };

        // if (teamID) userJson.teamID = teamID;
        console.log(userJson)

        const response = db.collection("users").doc(userID).set(userJson);
        // TODO: Save to Firebase
        // res.send(response);
        console.log('New user successfully created!')
        res.status(200).json({ message: 'New user created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
        // res.send(err);
    }
});

// Get Users
router.get('/user/:userId', (req, res) => {
    const { id } = req.query;

    try {
        // TODO: Fetch from Firebase

        console.log("")
        res.status(200).json();
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

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