// client/src/firebase.js
// Firebase client configuration using environment variables
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { config } from "./config";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: config.firebase.apiKey || "AIzaSyBXg4i1QeVLcnDyEfdw9-46ts920KtU9Lk",
  authDomain: config.firebase.authDomain || "office-sync-4eae8.firebaseapp.com",
  projectId: config.firebase.projectId || "office-sync-4eae8",
  storageBucket: config.firebase.storageBucket || "office-sync-4eae8.firebasestorage.app",
  messagingSenderId: config.firebase.messagingSenderId || "403466702178",
  appId: config.firebase.appId || "1:403466702178:web:63c549bf4ab8cd1a8d703b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);