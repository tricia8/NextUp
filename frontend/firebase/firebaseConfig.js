import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDKfCNEJ8ultGoba9GuvL8M5OWocbHEaZY",
  authDomain: "nextup-orbital.firebaseapp.com",
  projectId: "nextup-orbital",
  storageBucket: "nextup-orbital.firebasestorage.app",
  messagingSenderId: "589929497325",
  appId: "1:589929497325:android:faf7ed112b4357b7ff82e4",
};

let app, auth;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (error) {
    console.log("Error initializing app: " + error);
  }
} else {
  // app has been initialised
  app = getApp();
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
