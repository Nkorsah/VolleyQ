import express from 'express';
import { db, admin } from '../firebase.js';
import { userAuthInfo } from './userRoutes.js';
import gemini from '../gemini.js';
import { v4 as uuidv4 } from "uuid";
import { updateUser } from './helper functions/updateEntities.js';
import { calculateTeamSkillLevel } from './helper functions/skillLevel.js';

const router = express.Router();

export const updateTeam = async (teamID, updateData, allowedFields) => {
  if (!teamID) throw new Error("No teamID provided");

  const update = {};

  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      const isObject = typeof updateData[key] === "object" && updateData[key] !== null;
      if (isObject) {
        const teamRef = db.collection("teams").doc(teamID);
        const docSnap = await teamRef.get();
        const existing = docSnap.exists ? docSnap.data()[key] || {} : {};
        console.log(`Existing value for ${key} in DB:`, existing);
        update[key] = { ...existing, ...updateData[key] }; // merge nested objects
        console.log(`Merged value for ${key}:`, update[key]);
      } else {
        update[key] = updateData[key];
        console.log(`Set value for ${key}:`, update[key]);
      }
    }
  }

  const invalidFields = Object.keys(updateData).filter(
    (key) => !allowedFields.includes(key)
  );
  if (invalidFields.length > 0) {
    console.warn("Unexpected update fields:", invalidFields);
  }

  if (Object.keys(update).length === 0) {
    console.log("No valid fields to update");
    return null;
  }

  const teamRef = db.collection("teams").doc(teamID);
  await teamRef.update(update);

  const updatedSnap = await teamRef.get();
  if (!updatedSnap.exists) throw new Error("Team document not found after update");

  return updatedSnap.data();
};

//if you see a const uid = '1234567' we gotta replace that with actual auth

export const getUserID = async (authHeader) => {
  const userFirebaseDetails = await userAuthInfo(authHeader);

  if (!userFirebaseDetails) {
    // don't use `res` here — just return null
    return null;
  }

  console.log("grabbing user id from token..");

  // If your test token returns a string directly, use it
  // Otherwise use the uid from Firebase decoded token
  const userID = // this is like a shortened if staement
    typeof userFirebaseDetails === "string"
      ? userFirebaseDetails
      : userFirebaseDetails.uid;

  return userID;
};


// can only join one team at a time.
router.post('/create-team', async (req, res) => { // A player makes this request
  console.log('/api/create-team called...');
  try {
    const { team_name, team_settings, venueID } = req.body; // settings

    if (!team_name || typeof team_name !== 'string') {
      return res.status(400).json({ message: 'name is required' });
    }

    const userID = await getUserID(req.headers.authorization); // get userID from firebase auth
    console.log(`grabbing collection. and user id is.. ${userID}`);
    // const teamRef = db.collection('teams').doc();

    // examples of nested json fields
    // const team_settings = {
    //   team_color: 'FFFF',
    //   number_of_players: 8,
    //   private: true
    // } 

    // Also need to check if it's a valid venueID.
    //error handle invalid fields.
    // can't create team if you're already on a team.
    
    // grab user from DB
    const userDoc = await db.collection("users").doc(userID).get();
    const userData = userDoc.data();

    const teamMember = { // creating team member entity
      userID,
      name: userData.name,
      avatarUrl: userData.avatarUrl,
      team_leader: true
    }
    console.log(`new team member: ${JSON.stringify(teamMember)}`)
    
    const team_members = [teamMember] // denormalized users go in here

    const team_stats = {
      wins: 0,
      losses: 0,
      win_rate: 0,
      highest_win_streak: 0, 
      current_streak: 0
    }

    const match_status = {
      status: 'idle',
      current_matchID: null
    }
        
    const team = {
      teamID: uuidv4(), // unique id for the team
      venueID: venueID, // change this later
      team_name: team_name,
      owner_id: userID,
      members: team_members,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      team_settings,
      team_stats,
      match_status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('teams').doc(team.teamID).set(team); // creating the team document. 
    // creating the team document from the user. 
    const updateData = { teamID: team.teamID, team_name: team.team_name , team_leader: true} // changing the fields on the user side of things
    const updatedUser = await updateUser(userID, updateData);
    
        if (!updatedUser) {
          return res.status(400).json({ message: "No valid fields to update" });
        }
    console.log("User updated with teamID:", updatedUser);
    // await db.collection('users').doc(userID).set({ current_teamID: team.teamID }, { merge: true });

    console.log('Team successfully created!', team);
    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



// pulling mutiple teams from db. I want to get all teams from a certain criteria
// teams from a location
router.get('/teams', async (req, res) => { 
  console.log('/api/teams called...');
  try {
    const userID = await getUserID(req.headers.authorization);
    console.log(`and user id is.. ${userID}`);

    const snap = await db.collection('teams').get();
    // const snap = await db.collection('teams')
    //   .where('memberIds', 'array-contains', userID)
    //   .get();

    const teams = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
    res.status(200).json(teams);


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/team/:teamID', async (req, res) => {
  console.log('/api/team/:id called...');

  try {
    const { teamID } = req.params;

    const doc = await db.collection('teams').doc(teamID).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const team = { teamID: doc.teamID, ...doc.data() };

    res.status(200).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/teams/venue/:venueID', async (req, res) => {
  console.log('/api/teams/venue/:venueID called...');

  try {
    const { venueID } = req.params;

    const snap = await db
      .collection('teams')
      .where('venueID', '==', venueID)
      .get();

    if (snap.empty) {
      return res.status(404).json({ message: 'No teams found for this venue' });
    }

    const teams = snap.docs.map(doc => ({
      teamID: doc.id, // ✅ correct way
      ...doc.data(),
    }));

    res.status(200).json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// another user joins the team
// if user doesn't exist, don't add them. 
router.put('/join-team/:teamID', async (req, res) => {
  const { teamID } = req.params;

  try {
    // 1️⃣ Get user ID from token
    const userID = await getUserID(req.headers.authorization);
    if (!userID) {
      return res.status(401).json({ message: "Unauthorized or invalid token" });
    }
    console.log(`User ID from token: ${userID}`);

    // 2️⃣ Fetch user data
    const userDoc = await db.collection("users").doc(userID).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    const userData = userDoc.data();

    // 3️⃣ Fetch team data
    const teamRef = db.collection("teams").doc(teamID);
    const teamDoc = await teamRef.get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }
    const teamData = teamDoc.data();
    // console.log(`teamData.members is: ${JSON.stringify(teamData.members) }`)
    const rawMembers = teamData.members;

    const existingMembers = Array.isArray(rawMembers)
      ? rawMembers
      : rawMembers
        ? Object.values(rawMembers)
        : [];

    console.log("Existing members array length:", existingMembers.length, existingMembers);
    const maxPlayers = teamData.team_settings?.number_of_players || 8;
    console.log(`maximum number of players on this team is: ${maxPlayers}`)
    // 4️⃣ Check if team is full
  
    if (existingMembers.length >= maxPlayers) {
      return res.status(400).json({ message: "Team is already full" });
    }

    // 5️⃣ Check if user is already a member

  //  const existingMembers = Array.isArray(teamData.members) ? teamData.members : [];
console.log("Existing members array:", existingMembers);

const isAlreadyMember = existingMembers.some((member, index) => {
  console.log(`Comparing member[${index}].userID:`, member.userID, "with userID:", userID);
  return member.userID === userID;
});

console.log("Is user already a member?", isAlreadyMember);

if (isAlreadyMember) {
  return res.status(400).json({ message: "User already a member of this team" });
}

    if (existingMembers.some(member => member.userID === userID)) {
      return res.status(400).json({ message: "User already a member of this team" });
    }

    // 6️⃣ Create new member object
    const newMember = {
      userID,
      name: userData.name,
      avatarUrl: userData.avatarUrl,
      team_leader: false
    };
    console.log("Adding new member:", newMember);

    // 7️⃣ Update team members array
    await db.collection("teams").doc(teamID).update({
  members: [...existingMembers, newMember],
});
    // await updateTeam(teamID, { members: [...existingMembers, newMember] }, ["members"]); // my function

    // 8️⃣ Update user with team info
    const updateData = {
      teamID: teamData.teamID,
      team_name: teamData.team_name,
      team_leader: false
    };
    await updateUser(userID, updateData);

    // 9️⃣ Return updated team info
    const updatedTeamDoc = await teamRef.get();
    res.status(200).json({ message: "Joined team successfully", team: updatedTeamDoc.data() });

    // Recalculate overall Team Skill Score
    await recalculateTeamSkill(teamID);

  } catch (err) {
    console.error("Error in /join-team:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// use zod for type verification
router.delete("/leave-team/:teamID", async (req, res) => {
  const { teamID } = req.params;

  try {
    const userID = await getUserID(req.headers.authorization);

    if (!userID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const teamRef = db.collection("teams").doc(teamID);
    const teamDoc = await teamRef.get();

    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();

    // block leaving match if team is in a match
    const team_matchID = teamData.match_status.current_matchID
    if (team_matchID) {
      return res.status(409).json({
        message: "Team is currently in a match. Leave the court first.",
      });
    }

    //   members = [
    //   { userID: "1", team_leader: false },
    //   { userID: "2", team_leader: true },
    // ];


    const members = Array.isArray(teamData.members)
      ? teamData.members
      : Object.values(teamData.members || {});

    const isLeader = members.some(
      (m) => m.userID === userID && m.team_leader
    );

    const remainingMembers = members.filter(
      (m) => m.userID !== userID
    );

    // 🧠 CASE: leader leaves → transfer leadership
    if (isLeader && remainingMembers.length > 0) {
      const newLeaderID = remainingMembers[0].userID;

      await transferTeamLeader(teamID, userID, newLeaderID);
    }

    // 🧹 CASE: last member leaves → delete team
    // also if team is currently playing a match. Do not delete! 
    if (remainingMembers.length === 0) {
    
      await teamRef.delete(); // I should probably make a delete function for each entity
      await updateUser(userID, {
        teamID: null,
        team_name: null,
        team_leader: false,
      });

      return res.status(200).json({
        message: "Team deleted because last member left",
      });
    }

    // ✂️ Normal removal
    await teamRef.update({
      members: remainingMembers,
    });

    // Recalculate overall team skill score
    await recalculateTeamSkill(teamID);

    await updateUser(userID, {
      teamID: null,
      team_name: null,
      team_leader: false,
    });

    const updatedTeam = (await teamRef.get()).data();

    return res.status(200).json({
      message: "User left team",
      team: updatedTeam,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

const transferTeamLeader = async (teamID, currentLeaderID, newLeaderID) => {
  const teamRef = db.collection("teams").doc(teamID);
  const teamDoc = await teamRef.get();

  const members = teamDoc.data().members;

  const updatedMembers = members.map(m => {
    if (m.userID === newLeaderID) return { ...m, team_leader: true };
    if (m.userID === currentLeaderID) return { ...m, team_leader: false };
    return m;
  });

  const updatedTeam = {
    members: updatedMembers,
    owner_id: newLeaderID
  };

  await teamRef.update(updatedTeam);

  await Promise.all([
    updateUser(newLeaderID, { team_leader: true }),
    updateUser(currentLeaderID, { team_leader: false })
  ]);

  return updatedTeam;
};


router.delete('/kick/:userID', async (req, res) => {
  const { userID: targetUserID } = req.params;

  try {
    // 1️⃣ Get team leader ID (the one performing the kick)
    const team_leaderID = await getUserID(req.headers.authorization);
    if (!team_leaderID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2️⃣ Fetch team leader's user doc
    const leaderDoc = await db.collection("users").doc(team_leaderID).get();
    if (!leaderDoc.exists) {
      return res.status(404).json({ message: "Team leader not found" });
    }

    const leaderData = leaderDoc.data();
    const teamID = leaderData.teamID;

    if (!teamID) {
      return res.status(400).json({ message: "Team leader is not part of a team" });
    }

    // 3️⃣ Fetch team
    const teamRef = db.collection("teams").doc(teamID);
    const teamDoc = await teamRef.get();

    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();
    const rawMembers = teamData.members;
    const members = Array.isArray(rawMembers) ? rawMembers : rawMembers ? Object.values(rawMembers) : [];

    // 4️⃣ Check if team_leaderID is actually the team leader
    const leaderMember = members.find(m => m.userID === team_leaderID);
    if (!leaderMember?.team_leader) {
      return res.status(403).json({ message: "Only the team leader can kick members" });
    }

    // 5️⃣ Prevent kicking yourself
    if (team_leaderID === targetUserID) {
      return res.status(400).json({ message: "Leader cannot kick themselves" });
    }

    // 6️⃣ Check target exists
    const targetMember = members.find(m => m.userID === targetUserID);
    if (!targetMember) {
      return res.status(404).json({ message: "User not in team" });
    }

    // 7️⃣ Remove target
    const updatedMembers = members.filter(m => m.userID !== targetUserID);
    await teamRef.update({ members: updatedMembers });

    // 8️⃣ Clear kicked user's team info
    const updateData = { teamID: null, team_name: null, team_leader: false };
    await updateUser(targetUserID, updateData);

    // 9️⃣ Return updated team
    const updatedTeamDoc = await teamRef.get();
    res.status(200).json({ message: "User kicked from team", team: updatedTeamDoc.data() });

  } catch (err) {
    console.error("Error in /kick-member:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

router.delete('/delete', async (req, res) => {
  try {
    // 1️⃣ Get team leader ID (the one requesting deletion)
    const team_leaderID = await getUserID(req.headers.authorization);
    if (!team_leaderID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2️⃣ Fetch team leader's user doc
    const leaderDoc = await db.collection("users").doc(team_leaderID).get();
    if (!leaderDoc.exists) {
      return res.status(404).json({ message: "Team leader not found" });
    }

    const leaderData = leaderDoc.data();
    const teamID = leaderData.teamID;

    if (!teamID) {
      return res.status(400).json({ message: "Team leader is not part of a team" });
    }

    // 3️⃣ Fetch team
    const teamRef = db.collection("teams").doc(teamID);
    const teamDoc = await teamRef.get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamData = teamDoc.data();
    const rawMembers = teamData.members;
    const members = Array.isArray(rawMembers) ? rawMembers : rawMembers ? Object.values(rawMembers) : [];

    // 4️⃣ Check if the requester is actually the team leader
    const leaderMember = members.find(m => m.userID === team_leaderID);
    if (!leaderMember?.team_leader) {
      return res.status(403).json({ message: "Only the team leader can delete the team" });
    }

    // 5️⃣ Clear all members' team info
    const updateData = { teamID: null, team_name: null, team_leader: false };

    // for each member, delete the team info
    const updatePromises = members.map(m => updateUser(m.userID, updateData));
    await Promise.all(updatePromises);

    // 6️⃣ Delete the team document
    await teamRef.delete();

    res.status(200).json({ message: "Team successfully deleted" });

  } catch (err) {
    console.error("Error in /team/delete:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

router.put('/promote/:newLeaderID', async (req, res) => { // promote user

  const { newLeaderID } = req.params;

  try {
    // 1️⃣ Get team leader ID from token
    const team_leaderID = await getUserID(req.headers.authorization);
    if (!team_leaderID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2️⃣ Fetch current leader user document
    const leaderDoc = await db.collection("users").doc(team_leaderID).get();
    if (!leaderDoc.exists) {
      return res.status(404).json({ message: "Current leader not found" });
    }
    const leaderData = leaderDoc.data();

    // 3️⃣ Ensure current user is the team leader
    if (!leaderData.team_leader) {
      return res.status(403).json({ message: "Only current team leader can promote" });
    }

    // 4️⃣ Get the teamID from leader
    const teamID = leaderData.teamID;
    if (!teamID) {
      return res.status(400).json({ message: "Leader is not part of a team" });
    }

    // 5️⃣ Fetch team
    const teamRef = db.collection("teams").doc(teamID);
    const teamDoc = await teamRef.get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }
    const teamData = teamDoc.data();

    // 6️⃣ Normalize members
    const membersArray = Array.isArray(teamData.members)
      ? teamData.members
      : teamData.members
        ? Object.values(teamData.members)
        : [];

    // 7️⃣ Check newLeaderID is in team
    const newLeaderMember = membersArray.find(m => m.userID === newLeaderID);
    if (!newLeaderMember) {
      return res.status(400).json({ message: "New leader must be a member of the team" });
    }

    // 8️⃣ Update team members array
    const updatedMembers = membersArray.map(m => {
      if (m.userID === newLeaderID) return { ...m, team_leader: true };
      if (m.userID === team_leaderID) return { ...m, team_leader: false };
      return m;
    });

    // have to update ownerID
    await teamRef.update({ members: updatedMembers, owner_id: newLeaderID});

    // 9️⃣ Update user documents
    await updateUser(newLeaderID, { team_leader: true });
    await updateUser(team_leaderID, { team_leader: false });

    res.status(200).json({
      message: `Team leadership transferred to user ${newLeaderID}`,
      members: updatedMembers
    });

  } catch (err) {
    console.error("Error in /team/promote:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

router.patch('/update-stats/:teamID', async (req, res) => {
  const { teamID } = req.params;
  let { result } = req.body;

  console.log(`api.update-stats/${teamID} called...`);

  try {
    // 1️⃣ Validate result
    if (result !== 'win' && result !== 'loss') {
      return res.status(400).json({ message: 'result must be "win" or "loss"' });
    }
    // normalize key for Firestore
    const resultKey = result === 'loss' ? 'losse' : 'win';

    // 2️⃣ Fetch team
    const teamRef = db.collection('teams').doc(teamID);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const teamData = teamSnap.data();

    // 3️⃣ Atomically increment team stats
    await teamRef.update({
      [`team_stats.${resultKey}s`]: admin.firestore.FieldValue.increment(1),
    });

    // 4️⃣ Increment each member's stats
    const rawMembers = teamData.members;
    const members = Array.isArray(rawMembers)
      ? rawMembers
      : rawMembers
        ? Object.values(rawMembers)
        : [];

    // Loop through members and update their individual stats
    for (const member of members) {
      const userRef = db.collection('users').doc(member.userID);
      await userRef.update({
        [`stats.${resultKey}s`]: admin.firestore.FieldValue.increment(1),
      });
    }

    // 5️⃣ Return updated team
    const updatedSnap = await teamRef.get();
    res.status(200).json({ id: updatedSnap.id, ...updatedSnap.data() });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

router.patch('/reset-stats/:teamID', async (req, res) => {
  const { teamID } = req.params;
  console.log(`api/reset-stats/${teamID} called...`);

  try {
    // 1️⃣ Fetch the team
    const teamRef = db.collection('teams').doc(teamID);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // 2️⃣ Reset the team's stats
    await teamRef.update({
      team_stats: {
        wins: 0,
        losses: 0,
      },
    });

    // 3️⃣ Return updated team
    const updatedSnap = await teamRef.get();
    res.status(200).json({ id: updatedSnap.id, ...updatedSnap.data() });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

router.post('/analyze-team/:teamId', async (req, res) => {// Don't think I need to change this. 
  const { teamId } = req.params;
  console.log(`/api/analyze-team/${teamId} called...`);

  try {
    const teamRef = db.collection('teams').doc(teamId);
    const teamSnap = await teamRef.get();

    if (!teamSnap.exists) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const team = teamSnap.data();
    const { name, stats } = team;
    const total = stats.wins + stats.losses;
    const winRate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : 0;

    const prompt = `
      Analyze the following team performance data and provide a brief, 
      constructive analysis with key insights and recommendations:

      Team Name: ${name}
      Wins: ${stats.wins}
      Losses: ${stats.losses}
      Total Games: ${total}
      Win Rate: ${winRate}%

      Keep the analysis concise, around 3-4 sentences. Be encouraging but honest.
    `;

    const result = await gemini.model.generateContent(prompt);
    const analysis = result.response.text();

    res.status(200).json({ analysis });
  } catch (err) {
    console.error('ROUTE ERROR:', err.message, err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/:teamID/skill', async (req, res) => {
  const { teamID } = req.params;
  const { skill_level } = req.body;

  const valid = ['Beginner', 'Intermediate', 'Advanced'];
  if (!valid.includes(skill_level)) {
    return res.status(400).json({ message: 'skill_level must be Beginner, Intermediate, or Advanced' });
  }

  try {
    const userID = await getUserID(req.headers.authorization);
    const user = await getUser(userID);

    if (user.teamID !== teamID) {
      return res.status(403).json({ message: 'You can only update your own team skill level' });
    }

    await db.collection('teams').doc(teamID).update({ skill_level });

    return res.status(200).json({ message: 'Skill level updated', skill_level });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

async function recalculateTeamSkill(teamID) {
  const { skill_level, skill_score } = await calculateTeamSkillLevel(teamID, db);
  await db.collection('teams').doc(teamID).update({ skill_level, skill_score });
  console.log(`Team ${teamID} skill recalculated → ${skill_level} (${skill_score})`);
}


export default router;