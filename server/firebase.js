// firebase.js
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

const credentials = JSON.parse(
  await readFile(new URL('./firebase-key.json', import.meta.url))
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

export const db = admin.firestore();