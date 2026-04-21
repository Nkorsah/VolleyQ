import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import { db } from '../firebase.js'; 
import { getUserID } from './teamRoutes.js';
import { updateUser, updateMatch, updateMatchScore} from './helper functions/updateEntities.js';
import { getTeam, getUser,  } from './helper functions/getEntites.js';

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
      updatedAt: admin.firestore.FieldValue.serverTimestamp()

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
router.put('/:courtID/match/queue/join', async (req, res) => {
  console.log('match/queue/join called!');
  const { courtID } = req.params;

  try {
    const userID = await getUserID(req.headers.authorization);
    console.log(`Court host userID: ${userID}`);
    // get the user attribute that verifies that they're a team lead
    const user = await getUser(userID);
    console.log(JSON.stringify(user))

    if (!user.teamID) {
      return res.status(400).json({ message: 'User is not on a team' });
    }

    if (!user.team_leader) {
      return res.status(403).json({ message: 'User is not a team leader' });
    }

    const teamID = user.teamID; // team id from user

    console.log(JSON.stringify(user, null, 2));
    console.log("teamID: ",teamID);

    const team = await getTeam(teamID); // verifies if team exists

    // check if team is already in queue
    const currentQueue = await getQueue(courtID);
    if (currentQueue.includes(teamID)) {
      return res.status(409).json({ message: 'Team is already in the queue' });
    }

    // check max queue size
    const court = await getCourt(courtID);
    const max = court.court_settings.max_teams_in_queue;
    if (max && currentQueue.length >= max) {
      return res.status(409).json({ message: 'Queue is full' });
    }

    const match = await getMatch(courtID);
    const queueID = match.queueID;
    // console.log("qeueID: ",queueID)

    await addTeamToQueue(courtID, queueID, teamID); // updates queue
    // update court function? 
    const team_queue = await getQueue(courtID);

    // write to the queue. Might make a helper function on this
    if (!match.ongoing) {
      await updateCurrentTeamsInMatch(courtID, match); // put in match object
    }

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

// router.put('/:courtID/match/queue/advance', async (req, res) => {
//   console.log('match/queue/advance called!');
//   const { courtID } = req.params;

//   try {
//     const match = await getMatch(courtID);
//     const { queueID, matchID, ongoing } = match;

//     if (ongoing === true) {
//       return res.status(409).json({ message: 'Match is still ongoing. Cannot advance queue' });
//     }

//     await queueRef.update({
//       team_queue: admin.firestore.FieldValue.arrayUnion(teamID),
//     });
//     await db.collection("courts").doc(courtID).update({
//     queue_length: admin.firestore.FieldValue.increment(1) // Add 1 to whatever is currently there
//   });

//     // const updated = await queueDoc.get();
//   } else { // this means that it is a priority queue 
//     console.log('this is a priority queue. Do some logic here')
//   }

//   return team_queue;
// }

const updateCurrentTeamsInMatch = async (courtID, match) => {
  // 🚫 Don't update if game is in progress
  if (match.ongoing === true) {
    console.log("Game in progress. Skipping team update.");
    return;
  }

  const team_queue = await getQueue(courtID);

  const updateData = {};

  // ❌ No teams → reset match
  if (!team_queue || team_queue.length === 0) {
    updateData.team1 = null;
    updateData.team2 = null;
    updateData.ongoing = false;

    await updateMatch(match.matchID, updateData);
    console.log("Match reset (no teams)");
    return;
  }

  // ⚡ Fetch teams in parallel
  // fetch both teams and if the second team is does not exist, set team 2 to null
  const [team1, team2] = await Promise.all([
    getTeam(team_queue[0]),
    team_queue[1] ? getTeam(team_queue[1]) : null, // if statement in one line
  ]);

  // ✅ TEAM 1
  updateData.team1 = {
    teamID: team1.teamID,
    team_name: team1.team_name,
    team_score: 0,
    team_color: team1.team_settings.team_color,
  };

  // ✅ TEAM 2 (if exists)
  updateData.team2 = team2
    ? {
        teamID: team2.teamID,
        team_name: team2.team_name,
        team_score: 0,
        team_color: team2.team_settings.team_color,
      }
    : null;

  await updateMatch(match.matchID, updateData);

  console.log("Match teams updated!");
};

// this "deletes" teams from queue
router.put('/:courtID/match/queue/advance', async (req, res) =>{ // this is triggered when the match finishes and the next match is ready to play
  // advance the queue based on queue type.
  // once the queue is advnaced, pick the top two teams. 
  
  // if game status is playing do not advance. Error. 
  const {courtID}= req.params
  
  try {

    const {queueID, matchID, ongoing} = await getMatch(courtID)
     if (ongoing === true) {
      return res.status(409).json({ message: 'Match is still ongoing. Cannot advance queue' });
    }
    // const queueID = matchRef.data().queueID;
    // const match_status = matchRef.data().ongoing
    console.log("variables: ",queueID, matchID, ongoing);
    const matchRef = await db.collection("matches").doc(matchID);
    const match = await getMatch(courtID);
      // check if ref exists. 
    const queueDoc = await getQueueDoc(courtID)
    const queue_type = queueDoc.queue_type
    const team_queue = queueDoc.team_queue // the queue that consists of teamIDs.

    if (!team_queue || team_queue.length < 2) {
      return res.status(200).json({message: 'game is still ongoing. Cannot advance queue'});
    }

    const queueRef = db.collection('queues').doc(queueID);
    // const matchRef = db.collection('matches').doc(matchID);

    if (queue_type === 'FIFO') {
      // remove the first team from list and update the match element
      const popped_team = team_queue.shift();

      await queueRef.update({ team_queue });
      await db.collection('courts').doc(courtID).update({
        queue_length: team_queue.length,
      });
      await updateCurrentTeamsInMatch(courtID, match);

      console.log(`FIFO: removed team ${popped_team}`);
      return res.status(200).json({
        message: 'FIFO: queue has been updated',
        removed_teamID: popped_team,
        team_queue,
      });
    }

    if (queue_type === 'CIRCULAR') {
      // ── CIRCULAR: rotate first two teams to back ──────
      //
      // Before: [A, B, C, D]  ← A and B just played
      // After:  [C, D, A, B]  ← A and B go to back
      //
      const rotated = circularAdvance(team_queue);

      await queueRef.update({ team_queue: rotated });
      await updateCurrentTeamsInMatch(courtID, { ...match, ongoing: false });

      // Reset scores on match for next game
      await matchRef.update({
        'team1.team_score': 0,
        'team2.team_score': 0,
        ongoing: false,
      });

      console.log(`CIRCULAR: rotated queue → [${rotated.join(', ')}]`);
      return res.status(200).json({
        message: 'CIRCULAR: queue has been rotated',
        team_queue: rotated,
      });
    }

    if(queue_type == "Priority Queue"){
        // idk what to do for this one.
        console.log("This is a Priority Queue and it is being incremented.")
        return res.status(200).json({ message: 'Priority Queue: queue has been updated'})
      }

    return res.status(400).json({ message: `Unknown queue type: ${queue_type}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/:courtID/match/queue/leave', async (req, res) => {
  console.log('match/queue/leave called!');
  const { courtID } = req.params;

  try {
    const userID = await getUserID(req.headers.authorization);
    const user = await getUser(userID);

    if (!user.teamID) {
      return res.status(400).json({ message: 'User is not on a team' });
    }
    if (!user.team_leader) {
      return res.status(403).json({ message: 'Only the team leader can leave the queue' });
    }

    const teamID = user.teamID;
    const queueDoc = await getQueueDoc(courtID);
    const { queueID, team_queue } = queueDoc;

    if (!team_queue.includes(teamID)) {
      return res.status(404).json({ message: 'Team is not in the queue' });
    }

    //check if team is in a game
    const position = team_queue.indexOf(teamID);
    const match = await getMatch(courtID);

    if (match.ongoing && position < 2) {
      return res.status(409).json({
        message: 'Cannot leave queue while match is ongoing',
      });
    }

    const updated_queue = team_queue.filter(id => id !== teamID);

    const batch = db.batch();
    batch.update(db.collection('queues').doc(queueID), { team_queue: updated_queue });
    batch.update(db.collection('courts').doc(courtID), {
      queue_length: updated_queue.length,
    });
    await batch.commit();

    // Update match teams if the leaving team was in the top 2
    if (position < 2 && !match.ongoing) {
      await updateCurrentTeamsInMatch(courtID, match);
    }

    console.log(`Team ${teamID} left the queue`);
    return res.status(200).json({
      message: 'Team left the queue successfully',
      team_queue: updated_queue,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error. Could not leave queue' });
  }
});

router.get('/:courtID/match/queue', async (req, res) => {
  const { courtID } = req.params;

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

    const hydratedQueue = queue.map((teamId, index) => ({
      teamID: teamId,
      name: teamMap[teamId]?.team_name,
      position: index,
      status: index === 0 ? 'playing' : index === 1 ? 'on_deck' : 'waiting',
    }));

    return res.status(200).json(hydratedQueue);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error. Could not get queue' });
  }
});

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

// score function for scoreboard. increments by one
// router.put('/:courtID/match/update-score', async (req, res) => {
//   console.log("update-score has been called!");
//   // verify if user can make this request
//   const {courtID} = req.params;

//   const { team } = req.body 
//   // error handle the inputs

//   try { 
//     console.log('getting matchID')
//     const match = await getMatch(courtID)
//     const matchID = match.matchID

//     let team_name = ""
//      console.log('updating the cosen team')
//     if(team == 'team1') {
//       // update team1 score by one
//       //take the match ID and update the match score
//       // need the match ref. 
//       updateMatchScore(matchID, "team1"); 
      
//       team_name = match.team1.team_name
//     } else if (team == 'team2'){
//       updateMatchScore(matchID, "team2");
//       team_name = match.team2.team_name
//     }

//     //score has been updated!
    
//     const message = `${team_name} has scored!`
//     return res.status(200).json({message: message})
//   } catch (err) {
//     return res.status(500).json({ message: 'Internal Server Error. Could not end match' });
//   }
// })

router.put('/:courtID/match/update-score', async (req, res) => {
  console.log("update-score has been called!");

  const { courtID } = req.params;
  const { team } = req.body;

  // ✅ Validate request body
  if (!courtID) {
    return res.status(400).json({ message: "courtID is required" });
  }

  if (!team) {
    return res.status(400).json({ message: "team is required in body" });
  }

  if (team !== "team1" && team !== "team2") {
    return res.status(400).json({ message: "team must be 'team1' or 'team2'" });
  }

  try {
    console.log("getting matchID");

    const match = await getMatch(courtID);

    // ✅ Ensure match exists
    if (!match) {
      return res.status(404).json({ message: "Match not found for this court" });
    }

    const matchID = match.matchID;

    let team_name = "";

    console.log("updating the chosen team");

    if (team === "team1") {
      await updateMatchScore(matchID, "team1");

      if (!match.team1) {
        return res.status(400).json({ message: "team1 does not exist in match" });
      }

      team_name = match.team1.team_name;
    }

    if (team === "team2") {
      await updateMatchScore(matchID, "team2");

      if (!match.team2) {
        return res.status(400).json({ message: "team2 does not exist in match" });
      }

      team_name = match.team2.team_name;
    }

    return res.status(200).json(`${team_name} has scored!`);

  } catch (err) {
    console.error("update-score error:", err);

    return res.status(500).json({
      message: "Internal Server Error. Could not update score",
    });
  }
});

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

    // determine winner and loser
    const winner = team1_score > team2_score ? match.team1 : match.team2;
    const loser = team1_score > team2_score ? match.team2 : match.team1;

    await db.collection('matches').doc(match.matchID).update({
      ongoing: false,
      winnerID: winner.teamID,
      loserID: loser.teamID,
    });

    // update team win/loss stats
    const batch = db.batch();
    batch.update(db.collection('teams').doc(winner.teamID), {
      'stats.wins': admin.firestore.FieldValue.increment(1),
    });
    batch.update(db.collection('teams').doc(loser.teamID), {
      'stats.losses': admin.firestore.FieldValue.increment(1),
    });
    await batch.commit();

    console.log(`Match ended. Winner: ${winner.teamID}, Loser: ${loser.teamID}`);
    return res.status(200).json({
      message: 'Match has ended',
      winner: winner.teamID,
      loser: loser.teamID,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error. Could not end match' });
  }
});

router.put('/:courtID/match/score', async (req, res) => {
  console.log('match/score called!');
  const { courtID } = req.params;
  const { teamID, points } = req.body;

  if (!teamID || typeof points !== 'number') {
    return res.status(400).json({ message: 'teamID and points are required' });
  }

  try {
    const match = await getMatch(courtID);

    if (!match.ongoing) {
      return res.status(409).json({ message: 'No match is currently ongoing' });
    }

    // determine which team to update
    let teamField;
    if (match.team1?.teamID === teamID) {
      teamField = 'team1.team_score';
    } else if (match.team2?.teamID === teamID) {
      teamField = 'team2.team_score';
    } else {
      return res.status(404).json({ message: 'Team is not in the current match' });
    }

    await db.collection('matches').doc(match.matchID).update({
      [teamField]: admin.firestore.FieldValue.increment(points),
    });

    const updatedMatch = await getMatch(courtID);
    return res.status(200).json({
      message: 'Score updated',
      team1_score: updatedMatch.team1.team_score,
      team2_score: updatedMatch.team2.team_score,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error. Could not update score' });
  }
});

//circular queue logic

function circularAdvance(team_queue) {
  if (team_queue.length < 2) return team_queue;

  // take first two teams and move them to the back
  // [A, B, C, D] -> [C, D, A, B]
  const playing = team_queue.slice(0, 2);   // [A, B]
  const waiting = team_queue.slice(2);       // [C, D]
  return [...waiting, ...playing];           // [C, D, A, B]
}

//stuff to help the queue

async function addTeamToQueue(courtID, queueID, teamID) {
  const queueDoc = await getQueueDoc(courtID);
  const queue_type = queueDoc.queue_type;
  const queueRef = db.collection('queues').doc(queueID);

  if (queue_type === 'FIFO' || queue_type === 'CIRCULAR') {
    await queueRef.update({
      team_queue: admin.firestore.FieldValue.arrayUnion(teamID),
    });
    await db.collection('courts').doc(courtID).update({
      queue_length: admin.firestore.FieldValue.increment(1),
    });
  } else {
    console.log('Priority queue — implement logic here');
  }
}

//helper function
const getQueueDoc = async (courtID) => {
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

//priority queue shit

//skill level map

const SKILL_PRIORITY = {
  basic: 1,
  intermediate: 2,
  professional: 3,
};

//returns queue sorted by skill level ascending (lower skill first)
//each entry has teamID, skill_level, joinedAt, position

function prioritySort(queue_entries) {
  return [...queue_entries].sort((a, b) => {
    const skillDiff =
      (SKILL_PRIORITY[a.skill_level] ?? 99) - (SKILL_PRIORITY[b.skill_level] ?? 99);

    //if all same skill level, FIFO within same level
    if (skillDiff !== 0) return skillDiff;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });
}

//prefer same-skill matchup, fall back to any two teams

function findBestMatchup(sorted_entries) {
  if (sorted_entries.length < 2) return null;

  for (let i = 0; i < sorted_entries.length; i++) {
    for (let j = i + 1; j < sorted_entries.length; j++) {
      if (sorted_entries[i].skill_level === sorted_entries[j].skill_level) {
        return [sorted_entries[i], sorted_entries[j]];
      }
    }
  }
  return [sorted_entries[0], sorted_entries[1]];
}
export default router;

// const getMatch = async (matchID) => {

// }

// I can update queue by name.
// router.get('/match')