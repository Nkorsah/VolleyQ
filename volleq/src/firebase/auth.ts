// src/firebase/firebase-service.ts
import { auth } from "./firebase-service";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  UserCredential, 
  deleteUser,
  updateEmail
} from "firebase/auth";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

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

export const doDeleteUserAuth = async (): Promise<void> => {
  const user = auth.currentUser;
  console.log('deleting user from firebase auth..')
  if (!user) {
    throw new Error("No user is currently signed in");
  }

  await deleteUser(user);
};



export const reauthenticateUser = async (password: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user signed in");

  const credential = EmailAuthProvider.credential(user.email!, password);
  await reauthenticateWithCredential(user, credential);
};


// export const doUpdateEmail = async (newEmail: string, password?: string) => {
//   const user = auth.currentUser;
//   if (!user) throw new Error("No user signed in");

//   try {
//     await updateEmail(user, newEmail);
//     console.log("Email updated successfully!");
//   } catch (error: any) {
//     if (error.code === "auth/requires-recent-login") {
//       if (!password) throw new Error("User needs to reauthenticate");
//       // reauthenticate and retry
//       await reauthenticate(password);
//       await updateEmail(user, newEmail);
//     } else {
//       throw error;
//     }
//   }
// };
export const doUpdateEmail = async (newEmail: Email): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is currently signed in");

  if (!newEmail || !newEmail.includes("@")) {
    throw new Error("Invalid email address");
  }

  console.log("Updating user email in Firebase to:", newEmail);

  try {
    await updateEmail(user, newEmail); // must be after reauth
    console.log("Email updated successfully!");
  } catch (error: any) {
    if (error.code === "auth/requires-recent-login") {
      console.error("User needs to reauthenticate before changing their email.");
      throw new Error("Requires recent login");
    } else {
      console.error(error.code, error.message);
      throw error;
    }
  }
};

// export const doUpdateEmail = async (newEmail: Email): Promise<void> => {
//   const user = auth.currentUser;
//    if (!user) {
//     throw new Error("No user is currently signed in");
//   }

//   console.log('updating user email in firebase..')
//   try {
//     await updateEmail(user, newEmail)
//   } catch(error: any) {
//     if (error.code === "auth/requires-recent-login") {
//       console.error(
//         "User needs to reauthenticate before changing their email."
//       );
//   }
// }
// }

// app.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
//   // Send token to your backend via HTTPS
//   // ...
// }).catch(function(error) {
//   // Handle error
// });

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