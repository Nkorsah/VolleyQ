const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()

const admin = require('firebase-admin'); 
const credentials = require('./firebase-key.json');

admin.initializeApp({
    credential: admin.credential.cert(credentials)
})

const db = admin.firestore(); 



const router = require('./routes/router');
const teamRoutes = require('./routes/teamRoutes');
const playerRoutes = require('./routes/playerRoutes');
const matchRoutes = require('./routes/matchRoutes');
const statsRoutes = require('./routes/statsRoutes');
const aiRoutes = require('./routes/aiRoutes');

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

app.use('/api', teamRoutes);
app.use('/api', playerRoutes);
app.use('/api', matchRoutes);
app.use('/api', statsRoutes);
app.use('/api', aiRoutes);

// When we deploy this server, we'll use process.env ...
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://${HOST}:${PORT}`);
});