import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB2RysI7UnJkTqCtQd3juf9xVZ5-tZy7pA",
    authDomain: "finanzas-pro-a52ba.firebaseapp.com",
    projectId: "finanzas-pro-a52ba",
    storageBucket: "finanzas-pro-a52ba.firebasestorage.app",
    messagingSenderId: "196333297046",
    appId: "1:196333297046:web:0db4c35689f6e6d4c211b7",
    measurementId: "G-Q2JCYMG4NV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
