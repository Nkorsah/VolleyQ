import express from 'express';
import { db } from '../firebase.js';
import { v4 as uuidv4 } from "uuid";
import { getUserID } from './teamRoutes.js';
import admin from 'firebase-admin';
import { updateUser } from './helper functions/updateEntities.js';
const router = express.Router();
// get all teams at a venue
router.get('/teams', async (req, res) => { // system sends this.
  const { venueID } = req.body;

  const snap = await db
    .collection('teams')
    .where('venueID', '==', venueID)
    .get();

  const teams = snap.docs.map(doc => ({
    teamID: doc.id,
    ...doc.data(),
  }));

  res.status(200).json(teams);
});


// Venue { // will be used to sort teams too.
//   venueID: string,          // unique identifier for the venue
//   venue_name: string,       // display name, e.g. "Philadelphia Sports Center"
//   location: string,         // optional: city, address, or geolocation
//   capacity: number,         // optional: max number of teams/users
//   createdAt: Timestamp,     // when the venue was created
//   updatedAt: Timestamp,     // optional: last modified
// }


router.post('/create', async (req, res) => {
  console.log('/api/venue/create called...');

  try {
    const { venue_name, venue_description } = req.body;

    // validate required fields
    if (!venue_name || typeof venue_name !== 'string') {
      return res.status(400).json({ message: 'venue_name is required' });
    }

    // get the userID from auth
    const userID = await getUserID(req.headers.authorization);
    console.log(`Venue creator userID: ${userID}`);

    // generate unique venueID
    const venueID = uuidv4();

    // default number of teams/courts
    const number_of_teams = 0;
    const number_of_courts = 0;

    // create venue object
    const venue = {
      venueID,
      venue_name,
      venue_description: venue_description || '', // optional description
      venue_creator: userID, // track who created the venue
      address: null,          // will be set when a marker is created
      markerID: null,         // marker will be created later
      marker: null,           // marker object placeholder
      number_of_teams,
      number_of_courts,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: null,
    };

   
    try{
        const updateData = {"createdVenueID": venueID} // changing the fields on the user side of things
        const updatedUser = await updateUser(userID, updateData) // should fail if venue_creator does not exist

        
        if (!updatedUser) {
          return res.status(400).json({ message: "No valid fields to update" });
        }
        console.log("User updated with venue_creator set to true:", updatedUser);

    } catch(error){
        console.log(error);
         console.error("❌ Failed to update user. Aborting venue creation:", error);

        return res.status(400).json({
            message: "Failed to update user, venue not created",
            error: error.message,
        });
    }

    // save to Firestore
    await db.collection('venues').doc(venueID).set(venue);
    // set user venue_created user flag to true
    
    // I should also use updater functions to verify if value can be changed
 
    console.log('Venue successfully created!', venue);
    res.status(201).json(venue);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/', async (req, res) => { // system is calling this
   console.log('/venues called...');
  try {

    const snap = await db.collection('venues').get();
    // const snap = await db.collection('teams')
    //   .where('memberIds', 'array-contains', userID)
    //   .get();

    const all_venues = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(all_venues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
})

export default router;


// now we have to make update functions and delete functionality. 
