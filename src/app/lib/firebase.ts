
// src/app/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "8236150046ad45eb9eca295361b88626",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pulse-adc8d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pulse-adc8d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pulse-adc8d.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "394046395219",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:394046395219:android:24f0da50d146ec6ab2c7a6"
};

// Initialize Firebase app only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export Firestore instance
export const db = getFirestore(app);
