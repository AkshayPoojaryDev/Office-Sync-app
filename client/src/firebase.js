// client/src/firebase.js
// Firebase client configuration using environment variables
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { config } from "./config";

// Firebase configuration object constructed from environment variables
// These values are safe to expose in the client-side code
const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

// Initialize Firebase app instance
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app); // Authentication service
export const db = getFirestore(app); // Firestore database service