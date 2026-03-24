import express from 'express';
const router = express.Router();
// const admin = require('firebase-admin'); 
import { readFile } from 'fs/promises';

const credentials = JSON.parse(
  await readFile(new URL('../firebase-key.json', import.meta.url))
);
import admin from 'firebase-admin';
import { getDatabase, ref, set } from "firebase/database";
import { Timestamp } from 'firebase-admin/firestore';
import { stat } from 'fs';

admin.initializeApp({
    credential: admin.credential.cert(credentials)
})

const db = admin.firestore(); 
// app.post('/create', async (req, res) => {
//     try{
//         const id = req.body.email;
//         const userJson = {
//             email: req.body.email, 
//             firstName: req.body.firstName, 
//             lastName: req.body.lastName
//         };
//         const response = db.collection("users").doc(id).set(userJson);
//         res.send(response);

//     } catch(error) {
//         res.send(error);
//     }
// })

// Add New User
router.post('/user-create', (req, res) => {
  

    // if (!username || !password || !email) {
    //     return res.status(400).json({ message: 'Invalid username/password' });
    // }
    console.log("/api/user-create has been called! Attempting to create user...")
    try { 
        const { name, avatarUrl, createdAt, role, stats } = req.body;

        const userJson = {
            name: name,
            avatarUrl: avatarUrl,
            createdAt: createdAt,
            role: role,
            stats: stats,
        };

        console.log(userJson)

        const response = db.collection("users").doc(name).set(userJson);
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
router.get('/user', (req, res) => {
    const { name } = req.query;

    try {
        // TODO: Fetch from Firebase
        res.status(200).json({ message: 'List of users', filter: name || null });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update User
router.put('/user/:userId', (req, res) => {
    const { userId } = req.params;

    try {
        // TODO: Update Firebase
        res.status(200).json({ message: `User ${userId} updated` });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;