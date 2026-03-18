// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtz8KOcrwT6PCWdKYN83PgJBKEl49KRak",
  authDomain: "volleyq-46524.firebaseapp.com",
  projectId: "volleyq-46524",
  storageBucket: "volleyq-46524.firebasestorage.app",
  messagingSenderId: "919041397570",
  appId: "1:919041397570:web:6662add7c81d6230d7aedb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {app, auth}