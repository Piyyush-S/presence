// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBCUfhiM2jBeKDCaxaXwmew9Y89xVoVmU4",
  authDomain: "presencegrid.firebaseapp.com",
  projectId: "presencegrid",
  storageBucket: "presencegrid.firebasestorage.app",
  messagingSenderId: "884909430581",
  appId: "1:884909430581:web:9ea93e72b95c2eb14e1e7c",
  measurementId: "G-6WHM4SP9HZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);