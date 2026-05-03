import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxrnlr2ceYIGNfVFoZWargs6by12-Akwg",
  authDomain: "nutrilens-amd.firebaseapp.com",
  projectId: "nutrilens-amd",
  storageBucket: "nutrilens-amd.firebasestorage.app",
  messagingSenderId: "704404815769",
  appId: "1:704404815769:web:c6ca279fe4242fd0ed9d08"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
