import { db } from '../../firebase.js';

export const getUser = async (userID) => {
  const userRef = await db.collection("users").doc(userID).get();

  if (!userRef.exists) {
    throw new Error("User not found");
  }
  console.log(JSON.stringify(userRef.data()))
  return {
    userID: userRef.id,
    ...userRef.data(),
  };
};

export const getTeam = async (teamID) => {
  const teamRef = await db.collection("teams").doc(teamID).get();

  if (!teamRef.exists) {
    throw new Error("Team not found");
  }

  return {
    teamID: teamRef.id,
    ...teamRef.data(),
  };
};

// export const getQueueDoc = async (courtID) => { // returns the queue object 
//   const courtRef = await db.collection('courts').doc(courtID).get();

//   if (!courtRef.exists) {
//     throw new Error("Court not found");
//   }

//   const { queueID } = courtRef.data();

//   if (!queueID) {
//     throw new Error("Queue not found for this court");
//   }

//   const queueRef = await db.collection('queues').doc(queueID).get();

//   if (!queueRef.exists) {
//     throw new Error("Queue document does not exist");
//   }

//   return {
//     queueID: queueRef.id,
//     ...queueRef.data(),
//   };
// };

// export const getQueue = async (courtID) => { // returns the queue itself
//   const queueDoc = await getQueueDoc(courtID);
//   return queueDoc.team_queue || [];
// };

// export const getMatch = async (courtID) => {
//   // get court
//   const courtRef = await db.collection('courts').doc(courtID).get();

//   if (!courtRef.exists) {
//     throw new Error("Court not found");
//   }

//   const { matchID } = courtRef.data();

//   if (!matchID) {
//     throw new Error("Match not found for this court");
//   }

//   // get match
//   const matchRef = await db.collection('matches').doc(matchID).get();

//   if (!matchRef.exists) {
//     throw new Error("Match document does not exist");
//   }

//   return matchRef.data();
// };

// export const getCourt = async (courtID) => { // don't really need this function

//   const courtRef = await db.collection('courts').doc(courtID).get();

//   if (!courtRef.exists) {
//     throw new Error("Court not found");
//   }

//   return courtRef.data();
// }
