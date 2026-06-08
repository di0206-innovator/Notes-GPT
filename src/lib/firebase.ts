import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBdiElI2guegyLThJRuivfCsvZLW2Rbi-c",
  authDomain: "campus-gpt-support-v2026.firebaseapp.com",
  projectId: "campus-gpt-support-v2026",
  storageBucket: "campus-gpt-support-v2026.firebasestorage.app",
  messagingSenderId: "580147591710",
  appId: "1:580147591710:web:8c986eee49d5357d178c0f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
