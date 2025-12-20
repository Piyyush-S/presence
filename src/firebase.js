// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (new project)
const firebaseConfig = {
  apiKey: "AIzaSyC1rG9OJnfJmT9mlsF0HAsWpgecNh6PBY8",
  authDomain: "presence-83.firebaseapp.com",
  projectId: "presence-83",
  storageBucket: "presence-83.firebasestorage.app",
  messagingSenderId: "479671231284",
  appId: "1:479671231284:web:aabab6b3b285419de3fb61",
  measurementId: "G-2JW1Q9Z3EP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export app (optional but good practice)
export default app;
