// src/firebase/firebase-service.ts
import { auth } from "./firebase-service";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  UserCredential
} from "firebase/auth";

// ----------------------------
// Types for function parameters
// ----------------------------
type Email = string;
type Password = string;
type Team = string;

// ----------------------------
// Auth functions
// ----------------------------

export const doCreateUserWithEmailAndPassword = async (
  email: Email,
  password: Password
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailAndPassword = async (
  email: Email,
  password: Password
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  // result.user can be saved to Firestore here
  return result;
};

export const doSignOut = async (): Promise<void> => {
  return auth.signOut();
};

// Optional functions (commented out):
// export const doPasswordReset = async (email: Email) => {
//   return sendPasswordResetEmail(auth, email);
// };

// export const doPasswordChange = async (password: Password) => {
//   return updatePassword(auth.currentUser!, password);
// };

// export const doSendEmailVerification = async (email: Email) => {
//   return sendEmailVerification(auth.currentUser!, {
//     url: `${window.location.origin}/home`,
//   });
// };