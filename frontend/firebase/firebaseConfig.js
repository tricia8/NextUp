import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDKfCNEJ8ultGoba9GuvL8M5OWocbHEaZY",
  authDomain: "nextup-orbital.firebaseapp.com",
  projectId: "nextup-orbital",
  storageBucket: "nextup-orbital.firebasestorage.app",
  messagingSenderId: "589929497325",
  appId: "1:589929497325:android:faf7ed112b4357b7ff82e4",
};

const app = initializeApp(firebaseConfig);
       
const auth = getAuth(app);

export { app, auth };