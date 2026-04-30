import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import matchPredictRouter from './routes/matchRoutes.js';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './firebase-key.json' with { type: 'json' };


if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
// admin.initializeApp({
//     credential: admin.credential.cert(credentials)
// })
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ origin: '*', credentials: true, optionSuccessStatus: 200 }));

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
// sample router. It has it's own file. 
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
// router.get('/', (req, res) => res.send('Router working'));
// app.use('/', router) // this refers to the router file for the routes.
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
app.use('/api/venue/court', courtRoutes);
app.use('/api/match', matchPredictRouter);



const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';



const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://${HOST}:${PORT}`);

  if (app._router) {
    console.log('\n Registered routes:');
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        console.log(Object.keys(middleware.route.methods)[0].toUpperCase(), middleware.route.path);
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            const method = Object.keys(handler.route.methods)[0].toUpperCase();
            console.log(method, handler.route.path);
          }
        });
      }
    });
  } else {
    console.log(' app._router is undefined — routes may not have registered');
    console.log('app keys:', Object.keys(app));
  }
});

export default app;