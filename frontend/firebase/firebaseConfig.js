import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDKfCNEJ8ultGoba9GuvL8M5OWocbHEaZY",
  authDomain: "nextup-orbital.firebaseapp.com",
  projectId: "nextup-orbital",
  storageBucket: "nextup-orbital.firebasestorage.app",
  messagingSenderId: "589929497325",
  appId: "1:589929497325:android:faf7ed112b4357b7ff82e4",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);

export { app, auth, db };
