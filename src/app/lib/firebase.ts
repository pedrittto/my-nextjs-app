// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔒 Wklej tu swoje dane z Firebase
const firebaseConfig = {
  apiKey: "8236150046ad45eb9eca295361b88626",
  authDomain: "pulse-adc8d.firebaseapp.com",
  projectId: "pulse-adc8d",
  storageBucket: "pulse-adc8d.appspot.com",
  messagingSenderId: "394046395219",
  appId: "1:394046395219:android:24f0da50d146ec6ab2c7a6",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
