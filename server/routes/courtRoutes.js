import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import { db } from '../firebase.js'; 
import { getUserID } from './teamRoutes.js';
import { updateUser } from './helper functions/updateEntities.js';
import { getTeam, getUser } from './helper functions/getEntites.js';

const router = express.Router();

router.post('/create', async (req, res) => {  // court only passes down the settings. 
  console.log('/api/venue/court/create called...');

  try {
    const {
      court_name,
      max_teams_in_queue,
      queue_type,
      score_limit,
      venueID
    } = req.body;

    // validation
    if (!court_name || !venueID) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const userID = await getUserID(req.headers.authorization);
    console.log(`Court host userID: ${userID}`);

    // 🔥 IDs
    const courtID = uuidv4();
    const matchID = uuidv4();
    const queueID = uuidv4();

    // =====================
    // 🏀 COURT
    // =====================
    const court = {
      courtID,
      venueID,
      court_hostID: userID,
      matchID,
      queueID,
      queue_length: 0,

      court_settings: {
        court_name,
        max_teams_in_queue,
        queue_type,
        score_limit,
      },

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: null,
    };

    // =====================
    // MATCH
    // =====================
    const match = {
      matchID,
      courtID,
      queueID,

      team1: null,
      team2: null,

      ongoing: false,

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // =====================
    // QUEUE
    // =====================
    const queue = {
      queueID,
      courtID,
      matchID,
      queue_type,
      team_queue: [],  // gets by ID.

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // =====================
    // BATCH WRITE (IMPORTANT)
    // =====================
    const batch = db.batch();

    const courtRef = db.collection('courts').doc(courtID);
    const matchRef = db.collection('matches').doc(matchID);
    const queueRef = db.collection('queues').doc(queueID);

    batch.set(courtRef, court);
    batch.set(matchRef, match);
    batch.set(queueRef, queue);

    await batch.commit();

    // =====================
    // UPDATE USER
    // =====================
    try {
      const updateData = { hosted_courtID: courtID };

      const updatedUser = await updateUser(userID, updateData);

      if (!updatedUser) {
        throw new Error('User update failed');
      }

      console.log('User updated with hosted court');
    } catch (error) {
      console.error('⚠️ User update failed (court still created):', error);
      return res.status(400).json({message: "Failed to update user, court not created",
            error: error.message,})
    }

    console.log('🔥 Court + Match + Queue created successfully');

    return res.status(201).json({
      court,
      match,
      queue,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// teams host joins a queue
router.put('/:courtID/match/queue/join', async (req, res) => { // need error handling on this. And to send a response
  console.log('match/queue/join called!')
  const {courtID} = req.params

  try {
      const match = await getMatch(courtID); // match object
      const queueID = match.queueID;
      // console.log("qeueID: ",queueID)

      const userID = await getUserID(req.headers.authorization);
      console.log(`Court host userID: ${userID}`);

      // get the user attribute that verifies that they're a team lead
      const user = await getUser(userID);
      console.log(JSON.stringify(user))

      if (!user.teamID) {
        return res.status(400).json({ message: "User is not on a team" });
      }

      if (!user.team_leader) {
        return res.status(403).json({ message: "User is not a team leader" });
      }
 
      const teamID = user.teamID; // team id from user

      console.log(JSON.stringify(user, null, 2));
      console.log("teamID: ",teamID);

      const team = await getTeam(teamID); // verifies if team exists
      
      await addTeamToQueue(courtID, queueID, teamID); // updates queue

      // update court function? 
      const team_queue = await getQueue(courtID)  
      // write to the queue. Might make a helper function on this
      await updateCurrentTeamsInMatch(courtID, match) // put in match object
      return res.status(200).json({ 
        message: 'Team Join success!', 
        team: JSON.stringify(team), 
        team_queue: team_queue
      })
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error. Cannot join queue' });
  }

})

async function addTeamToQueue(courtID, queueID, teamID) { // updates the queue based on the queue type
  // i should throw some errors here too
  const team_queue = await getQueue(courtID)
  const queueDoc = await getQueueDoc(courtID)
  const queue_type = queueDoc.queue_type
  console.log('queue, ', JSON.stringify())
  console.log('queue type: ', queue_type)
  const queueRef = db.collection("queues").doc(queueID);

  if (queue_type == 'FIFO' || queue_type == 'CIRCULAR') {

    await queueRef.update({
      team_queue: admin.firestore.FieldValue.arrayUnion(teamID),
    });
    await db.collection("courts").doc(courtID).update({
    queue_length: admin.firestore.FieldValue.increment(1) // Add 1 to whatever is currently there
  });

    // const updated = await queueDoc.get();
  } else { // this means that it is a priority queue 
    console.log('this is a priority queue. Do some logic here')
  }

  return team_queue;
}

const updateCurrentTeamsInMatch = async (courtID, match) => { // array is already updated so pull the first two entries
  // point to the first two entries of the array. if array is empty set ongoing status to false

    // might make a function for this. Updates the match entity
    
  const team_queue = await getQueue(courtID)
  const matchRef = db.collection("matches").doc(match.matchID)
    // put the first two entries in team A and team B
    // 
    // team A is always guaranteed because of this function. 
    // I can turn this into a seperate function because I will have to repeat updating the top two teams. 
  if(match.ongoing == true){
    console.log("game is currently in progress. Will not update teams until game has finished")
  }

  const team1 = await getTeam(team_queue[0]); // get the first team id at entry 0 
  console.log(JSON.stringify(team1))
  const team1_data = {
    teamID: team1.teamID,
    team_name: team1.team_name,
    team_score: 0,
    team_color: team1.team_settings.team_color
  }
  await matchRef.update({ // write the teams to the match
    team1: team1_data,
  });
  console.log('team1 added!')

  if(team_queue.length >= 2){ // adding the second team
    const team2 = await getTeam(team_queue[1]);
    const team2_data = {
      teamID: team2.teamID,
      team_name: team2.team_name,
      team_score: 0,
      team_color: team2.team_settings.team_color
    }

    await matchRef.update({
      team2: team2_data,
    });
    console.log('team2 added!')
  }


}

// this "deletes" teams from queue
router.put('/:courtID/match/queue/advance', async (req, res) =>{ // this is triggered when the match finishes and the next match is ready to play
  // advance the queue based on queue type.
  // once the queue is advnaced, pick the top two teams. 
  
  // if game status is playing do not advance. Error. 
  const {courtID}= req.params
  
  try {

    const {queueID, matchID, ongoing} = await getMatch(courtID)
    // const queueID = matchRef.data().queueID;
    // const match_status = matchRef.data().ongoing
    console.log("variables: ",queueID, matchID, ongoing);
    const matchRef = await db.collection("matches").doc(matchID);
    const match = await getMatch(courtID);
      // check if ref exists. 
    const queueDoc = await getQueueDoc(courtID)
    const queue_type = queueDoc.queue_type
      
    const queueRef = await db.collection("queues").doc(queueID);
    const team_queue = queueDoc.team_queue // the queue that consists of teamIDs. 
    console.log('match_status', ongoing)
    if(ongoing === true){
      return res.status(200).json({message: 'game is still ongoing. Cannot advance queue'})
    }

    if(team_queue && team_queue.length > 1 && ongoing === false){
      if(queue_type == "FIFO"){
        // remove the first team from list and update the match element
        console.log("This is a FIFO Queue and it is being incremented.")
        const popped_team = team_queue.shift();// remove the first entry
        await queueRef.update({
          team_queue,
        })
        await updateCurrentTeamsInMatch(courtID, match) // update match with the top two teams in queue
        // update the current number of teams per match in court 
        await db.collection("courts").doc(courtID).update({ // update length of queue in the courtID
          queue_length: team_queue.length,
        });

        return res.status(200).json({ message: 'FIFO: queue has been updated', removed_teamID: popped_team})
      }
      if(queue_type == "Circular"){
        // move the top element of the queue to the bottom
          console.log("This is a FIFO Queue and it is being incremented.")
          return res.status(200).json({ message: 'Circular: queue has been updated'})
      }
      if(queue_type == "Priority Queue"){
        // idk what to do for this one.
        console.log("This is a Priority Queue and it is being incremented.")
        return res.status(200).json({ message: 'Priority Queue: queue has been updated'})
      }
    } else if(ongoing == true){
      return res.status(409).json({message: 'Match is still ongoing. Cannot change queue'})
      // 409 response is for a conflict
    } else {

      await matchRef.update({
        ongoing: false,
      });
      // return did not increment. This is not an error though. 
      return res.status(200).json({ message: 'Queue did not change. there needs to be at least two teams in queue to advance'})

    }
      
  } catch(error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
})

// make a leave queue route. so if a team leaves a match, they get deleted from the queue. 
export default router;

router.get('/:courtID/match/queue', async (req, res) =>{
  const { courtID } = req.params

  try{

    const queue = await getQueue(courtID)

      // ✅ FIX: handle empty queue
    if (!queue || queue.length === 0) {
      return res.status(200).json([]);
    }

    // console.log(JSON.stringify(queue))// check if queue is empty

    const teams = await db.collection('teams')
    .where('teamID', 'in', queue) // queuery can only take 10 items max
    .get();

    const teamMap = {}; 
    teams.forEach(doc => {
      teamMap[doc.id] = doc.data();
    });

    const hydratedQueue = queue.map(teamId => ({
      teamID: teamId,
      name: teamMap[teamId]?.team_name,
    }));

    res.status(200).json(hydratedQueue)
  } catch(err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error. Could not get queue' });
  }
})

router.put('/:courtID/match/start', async (req, res) => { // starts the match
  const {courtID} = req.params
  try {
    // const court = getCourt(courtID)
    const team_queue = await getQueue(courtID)
    
    if(team_queue.length < 2){
      return res.status(409).json({
  message: "At least 2 teams are required to start the match"
});
    }
    // we need two teams to start. So check the length of the queue
    console.log('getting match obj')
    const match = await getMatch(courtID)
    if(match.ongoing == true){
      return res.status(200).json({message: "match has already started!"})
    }
    console.log('getting matchRef')
    const matchRef = await db.collection("matches").doc(match.matchID);
    console.log('updating match ')
    await matchRef.update({
      ongoing: true,
    });

    return res.status(200).json("Match started!")
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error. Could not start match', error: err });
  }
})


router.put('/:courtID/match/end', async (req, res) => {
  const {courtID} = req.params
  try {
    const court = await getCourt(courtID)
    const max_score = court.court_settings.score_limit


    const match = await getMatch(courtID)
    const matchID = match.matchID
    if(match.ongoing == false){
      return res.status(200).json({message: "no game is ongoing at this court"})
    }

    const team1_score = match.team1.team_score
    const team2_score = match.team2.team_score

    if(!(team1_score >= max_score || team2_score >= max_score)){
      return res.status(409).json({ message: 'A team did not reach maximum score yet. Cannot end match' });
    }

    const matchRef = await db.collection("matches").doc(matchID);

    // verify 
    await matchRef.update({
      ongoing: false,
    });

    // add win / loss logic here.
    return res.status(200).json("Match has ended")
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error. Could not end match' });
  }
})



// helper function 
const getQueueDoc = async (courtID) => { // returns the queue object 
  const courtRef = await db.collection('courts').doc(courtID).get();

  if (!courtRef.exists) {
    throw new Error("Court not found");
  }

  const { queueID } = courtRef.data();

  if (!queueID) {
    throw new Error("Queue not found for this court");
  }

  const queueRef = await db.collection('queues').doc(queueID).get();

  if (!queueRef.exists) {
    throw new Error("Queue document does not exist");
  }

  return {
    queueID: queueRef.id,
    ...queueRef.data(),
  };
};

const getQueue = async (courtID) => { // returns the queue itself
  const queueDoc = await getQueueDoc(courtID);
  return queueDoc.team_queue || [];
};

const getMatch = async (courtID) => {
  // get court
  const courtRef = await db.collection('courts').doc(courtID).get();

  if (!courtRef.exists) {
    throw new Error("Court not found");
  }

  const { matchID } = courtRef.data();

  if (!matchID) {
    throw new Error("Match not found for this court");
  }

  // get match
  const matchRef = await db.collection('matches').doc(matchID).get();

  if (!matchRef.exists) {
    throw new Error("Match document does not exist");
  }

  return matchRef.data();
};

const getCourt = async (courtID) => { // don't really need this function

  const courtRef = await db.collection('courts').doc(courtID).get();

  if (!courtRef.exists) {
    throw new Error("Court not found");
  }

  return courtRef.data();
}


// const getMatch = async (matchID) => {

// }

// I can update queue by name.
// router.get('/match')