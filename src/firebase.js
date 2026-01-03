import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCUfhiM2jBeKDCaxaXwmew9Y89xVoVmU4",
  authDomain: "presence-83.firebaseapp.com",
  projectId: "presence-83",
  storageBucket: "presence-83.appspot.com",
  messagingSenderId: "479671231284",
  appId: "1:479671231284:web:aabab6b3b285419de3fb61",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
