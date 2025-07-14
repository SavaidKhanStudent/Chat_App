// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getMessaging } from 'firebase/messaging';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDg_-3E-vnUD2rLK8jh-E2D69qM0YMs-U0",
  authDomain: "chatapp-e4e25.firebaseapp.com",
  projectId: "chatapp-e4e25",
  storageBucket: "chatapp-e4e25.firebasestorage.app",
  messagingSenderId: "270756558519",
  appId: "1:270756558519:web:dc87e35c50420413817f32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const googleProvider = new GoogleAuthProvider();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const messaging = getMessaging(app);

export { app }; // Export app itself for messaging initialization
