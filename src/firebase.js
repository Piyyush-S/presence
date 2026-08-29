import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCUfhiM2jBeKDCaxaXwmew9Y89xVoVmU4",
  authDomain: "presencegrid.firebaseapp.com",
  projectId: "presencegrid",
  storageBucket: "presencegrid.firebasestorage.app",
  messagingSenderId: "884909430581",
  appId: "1:884909430581:web:9ea93e72b95c2eb14e1e7c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;