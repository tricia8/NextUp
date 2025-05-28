import { createContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { showMessage } from "react-native-flash-message";
import { StatusBar } from "react-native";
import { useRouter } from "expo-router";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Login function
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const results = userCredential.user;
      if (results.emailVerified === false) {
        // hasn't verified email
        showMessage({
          message: "Warning",
          description: "Please verify your email to login.",
          type: "warning",
          icon: "auto",
          statusBarHeight: StatusBar.currentHeight, //Android only
          floating: true,
          color: "#4a2516",
        });

        return;
      }
      router.replace("/(main)/(tabs)"); // login success: redirect user to homepage
    } catch (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  }

  // Register function
  async function register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const results = userCredential.user;
      await sendEmailVerification(results);
      showMessage({
        message: "Verification Required",
        description: `A verification email was sent to ${email}. Please verify your email before logging in.`,
        type: "warning",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
      });
    } catch (error) {
      console.error("Signup error:", error.message);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error.message);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
