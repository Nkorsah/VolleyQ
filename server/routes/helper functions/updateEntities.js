import { db } from '../../firebase.js';
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

  const validUpdate = strictValidateUpdate(userSchema, updateData);

  if (Object.keys(validUpdate).length === 0) {
    throw new Error("No valid fields to update");
  }

  await userRef.update(validUpdate);

  const updated = await userRef.get();

  return updated.data();
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