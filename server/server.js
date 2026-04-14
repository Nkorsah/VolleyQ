// const express = require('express')
// const cors = require('cors')
// const bodyParser = require('body-parser')

// const admin = require('firebase-admin'); 
// const credentials = require('./firebase-key.json');
// import { configDotenv } from 'dotenv';

// documentation: https://firebase.google.com/docs/firestore/manage-data/add-data#node.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
// import admin from 'firebase-admin';
// import { getDatabase, ref, set } from "firebase/database";
// import { doc, setDoc } from "firebase/firestore"; 

import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore'
import serviceAccount from './firebase-key.json' with { type: 'json' };

const app = express()


if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();
// admin.initializeApp({
//     credential: admin.credential.cert(credentials)
// })
const data = {
  name: 'Los Angeles',
  state: 'CA',
  country: 'USA'
};

// Add a new document in collection "cities" with ID 'LA'
// const res = await db.collection('cities').doc('LA').set(data);
// Example request. 
try {
  await db.collection('cities').doc('LA').set(data);

  console.log('success')
} catch (error) {
  console.error('Error', error)
}

// creating a document
// await db.collection('cities').doc('new-city-id').set(data);

// const db = admin.firestore(); 

// db = getDatabase()

// getting the routes from other files. 
import router from './routes/router.js'; // sample router. It has it's own file. 
import teamRoutes from './routes/teamRoutes.js';
import userRoutes from './routes/userRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import markerRoutes from './routes/markerRoutes.js';
import venueRoutes from './routes/venueRoutes.js';
import courtRoutes from './routes/courtRoutes.js'


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

const corsOptions = {
    origin: '*', 
    credentials: true, 
    optionSuccessStatus: 200
}

app.use(cors(corsOptions));
router.get('/', (req, res) => res.send('Router working'));
app.use('/', router) // this refers to the router file for the routes.
// app.get('/users')
app.post('/create', async (req, res) => {
    try{
        const id = req.body.email;
        const userJson = {
            email: req.body.email, 
            firstName: req.body.firstName, 
            lastName: req.body.lastName
        };
        const response = db.collection("users").doc(id).set(userJson);
        res.send(response);

    } catch(error) {
        res.send(error);
    }
})

// The different routes for users. 
// 'api/venue/team' to replace 'api/team' 
app.use('/api/team', teamRoutes);
app.use('/api', userRoutes);
app.use('/api', matchRoutes);
app.use('/api', statsRoutes);
app.use('/api', aiRoutes);
app.use('/api', markerRoutes); 
app.use('/api/venue', venueRoutes); 
app.use('/api/venue/court', courtRoutes)

// When we deploy this server, we'll use process.env ...
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://${HOST}:${PORT}`);
});

export default app;