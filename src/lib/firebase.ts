import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAUiHNGILWkGT0uC5CkJ3Edo8y_GDo_bdQ",
  authDomain: "studio-9817976701-89717.firebaseapp.com",
  projectId: "studio-9817976701-89717",
  storageBucket: "studio-9817976701-89717.firebasestorage.app",
  messagingSenderId: "483878889475",
  appId: "1:483878889475:web:b50a216f665b3f6fa8c636"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
