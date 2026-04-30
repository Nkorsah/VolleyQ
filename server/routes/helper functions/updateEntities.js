import { db } from '../../firebase.js';
import { admin } from '../../firebase.js';
// import admin from 'firebase-admin';

export const strictValidateUpdate = (schema, updateData) => {
  const validUpdate = {};
  const rejectedFields = [];

  for (const key of Object.keys(updateData)) {
    if (!(key in schema)) {
      rejectedFields.push(key);
      continue;
    }

    validUpdate[key] = updateData[key];
  }

  // 🚨 HARD FAIL if ANY invalid fields exist
  if (rejectedFields.length > 0) {
    throw new Error(
      `Invalid update fields: ${rejectedFields.join(", ")}`
    );
  }

  return validUpdate;
};

export const userSchema = { // the create route has to match up with this.
  name: "string",
  email: "string",
  avatarUrl: "string",

  teamID: "string",
  team_name: "string",
  team_leader: "boolean",

  createdVenueID: "array",

  hosted_courtID: "string",
  stats: "object",
};

export const updateUser = async (userID, updateData) => {
  const userRef = db.collection("users").doc(userID);

  const snap = await userRef.get();
  if (!snap.exists) {
    throw new Error("User not found");
  }

  const existingUser = snap.data();

  const validUpdate = strictValidateUpdate(userSchema, updateData);

  if (Object.keys(validUpdate).length === 0) {
    throw new Error("No valid fields to update");
  }

  await userRef.update(validUpdate);

  const updatedSnap = await userRef.get();
  const updatedUser = updatedSnap.data();

  // 🔥 NEW
  await syncUserUpdates(existingUser, updatedUser);

  return updatedUser;
};

// updates the team entity (members array) when the user gets changed
// so when a user changes their name, profile pic etc, they will see changes live on the team. 
const syncUserUpdates = async (oldUser, newUser) => {

  // 🧠 Only run if relevant fields changed
  const nameChanged = oldUser.name !== newUser.name;
  const avatarChanged = oldUser.avatarUrl !== newUser.avatarUrl;

  if (!nameChanged && !avatarChanged) return;

  const teamID = newUser.teamID;
  if (!teamID) return; // user not in a team

  const teamRef = db.collection("teams").doc(teamID);
  const teamSnap = await teamRef.get();

  if (!teamSnap.exists) return;

  const teamData = teamSnap.data();

  const updatedMembers = teamData.members.map((member) => {
    if (member.userID !== newUser.userID) return member;

    return {
      ...member,
      name: newUser.name,
      avatarUrl: newUser.avatarUrl,
    };
  });

  await teamRef.update({
    members: updatedMembers,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};


export const venueSchema = {
  venueID: "string",
  venue_name: "string",
  venue_description: "string",

  venue_creator: "string",

  address: "object",

  markerID: "string",
  marker: "object",

  number_of_teams: "number",
  number_of_courts: "number",

  createdAt: "object",
  updatedAt: "object",
};

export const updateVenue = async (venueID, updateData) => {
  const venueRef = db.collection("venues").doc(venueID);

  const snap = await venueRef.get();
  if (!snap.exists) {
    throw new Error("Venue not found");
  }

  const validUpdate = strictValidateUpdate(venueSchema, updateData);

  if (Object.keys(validUpdate).length === 0) {
    throw new Error("No valid fields to update");
  }

  await venueRef.update(validUpdate);

  const updated = await venueRef.get();

  return updated.data();
};


// export const updateMatch = async (matchID, updateData) => {
//   const matchRef = db.collection("matches").doc(matchID);

//   const snap = await matchRef.get();
//   if (!snap.exists) {
//     throw new Error("Match not found");
//   }

//   const validUpdate = strictValidateUpdate(matchSchema, updateData);

//   if (Object.keys(validUpdate).length === 0) {
//     throw new Error("No valid fields to update");
//   }

//   validUpdate.updatedAt = new Date().toISOString();

//   await matchRef.update(validUpdate);

//   const updated = await matchRef.get();
//   return updated.data();
// };

//---------------- updating teams ----------------------------//
export const teamSchema = {
  teamID: "string",
  venueID: "string",
  team_name: "string",
  owner_id: "string",

  members: "array",

  team_settings: "object",
  team_stats: "object",

  match_status: "object", // ✅ NEW

  createdAt: "object",
  updatedAt: "object",
};

export const updateTeam = async (teamID, updateData) => { // handles updating other entities if the team gets updated
  const teamRef = db.collection("teams").doc(teamID);

  const snap = await teamRef.get();
  if (!snap.exists) {
    throw new Error("Team not found");
  }

  const existingTeam = snap.data();

  const validUpdate = strictValidateUpdate(teamSchema, updateData);

  if (Object.keys(validUpdate).length === 0) {
    throw new Error("No valid fields to update");
  }

  // get the time of update
  validUpdate.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  // update the team
  await teamRef.update(validUpdate);

  const updatedSnap = await teamRef.get();
  const updatedTeam = updatedSnap.data();

  // 🔥 Optional sync hooks (explained below)
  // 
  await syncTeamUpdates(existingTeam, updatedTeam);

  return updatedTeam;
};

// updates the user if need to, updates match if need to, doesn't need to update queue because teamID's never change
const syncTeamUpdates = async (oldTeam, newTeam) => {

  // 🧠 1. Team name changed → update users
  if (oldTeam.team_name !== newTeam.team_name) {
    const batch = db.batch();

    for (const member of newTeam.members) {
      const userRef = db.collection("users").doc(member.userID);

      batch.update(userRef, {
        team_name: newTeam.team_name,
      });
    }

    await batch.commit();
  }

  // 🧠 2. If team is currently in a match → update match
  const matchID = newTeam.match_status?.current_matchID;

  if (!matchID) return; // not in a match → done

  const matchRef = db.collection("matches").doc(matchID);
  const matchSnap = await matchRef.get();

  if (!matchSnap.exists) return;

  const matchData = matchSnap.data();

  let updated = false;

  const updatedMatch = { ...matchData };

  // 🔥 update team1
  if (matchData.team1?.teamID === newTeam.teamID) {
    updatedMatch.team1 = {
      ...matchData.team1,
      team_name: newTeam.team_name,
    };
    updated = true;
  }

  // 🔥 update team2
  if (matchData.team2?.teamID === newTeam.teamID) {
    updatedMatch.team2 = {
      ...matchData.team2,
      team_name: newTeam.team_name,
    };
    updated = true;
  }

  if (!updated) return;

  // ✅ use updateMatch (good instinct)
  await updateMatch(matchID, {
    team1: updatedMatch.team1,
    team2: updatedMatch.team2,
  });
};

//------------ Match Logic -------------------------------//

export const matchSchema = {
  matchID: "string",
  courtID: "string",
  queueID: "string",

  ongoing: "boolean",

  team1: "object",
  team2: "object",

  createdAt: "object",
};

// writes to the match entity and write the the court entity if team1 and team2 changes
export const updateMatch = async (matchID, updateData) => {
  const matchRef = db.collection("matches").doc(matchID);

  const snap = await matchRef.get();
  if (!snap.exists) {
    throw new Error("Match not found");
  }

  const existingMatch = snap.data(); // might be redundant

  const validUpdate = strictValidateUpdate(matchSchema, updateData);

  if (Object.keys(validUpdate).length === 0) {
    throw new Error("No valid fields to update");
  }

  validUpdate.updatedAt = new Date().toISOString();

  // 🔥 Update match
  await matchRef.update(validUpdate);

  // 🔥 Get latest match data
  const updatedSnap = await matchRef.get();
  const updatedMatch = updatedSnap.data();

  // 🔥 Sync court summary
  await updateCourtMatchSummary(existingMatch.courtID, updatedMatch);

  return updatedMatch;
};

export const updateMatchScore = async (matchID, team) => {
  const matchRef = db.collection("matches").doc(matchID);

  await matchRef.update({
    [`${team}.team_score`]: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

// happens when team1 and team2 changes
const updateCourtMatchSummary = async (courtID, matchData) => {
  const courtRef = db.collection("courts").doc(courtID);

  await courtRef.update({
    match_summary: {
      team1_name: matchData.team1?.team_name || null,
      team2_name: matchData.team2.team_name || null,
      ongoing: matchData.ongoing ?? false,
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

// need an update queue function becuase the queue needs to update the length of the queue in the court
