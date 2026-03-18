import { auth } from "./firebase-service";

import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword} from "firebase/auth";
// auth functions


export const doCreateUserWithEmailAndPassword = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
}

export const doSignInWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
}

export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider(); 
    const result = await signInWithPopup(auth, provider);
    //result.user save to firestore.

    return result;
};

export const doSignOut = () => {
    return auth.signOut();
};

// export const doPasswordReset = (email) => {
//     return sendPasswordRestetEmail(auth, email);
// }

// export const doPasswordChange = (password) => {
//     return updatePassword(auth.currentUser, password);
// }

// export const doSendEmailVerification = (email) => {
//     return sendEmailVerification(auth.currentUser, {
//         url: `${window.location.origin}/home`,
//     });
// }

