import { createContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { showMessage } from "react-native-flash-message";
import { StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { useMemo } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      await user.reload(); // Refreshes the user's data from Firebase
      setUser(auth.currentUser); // Use updated user info
    } else {
      setUser(null);
    }
    setLoading(false);
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
          autoHide: false,
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
        color: "black",
        duration: 2300,
      });
      return results;
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

  // Forgot password function
  async function forgotPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      showMessage({
        message: "Check your email",
        description: `If an account is associated with ${email}, you'll receive a password reset email shortly.`,
        type: "success",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
      });
      router.push("./login");
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
      throw error;
    }
  }

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      forgotPassword,
    }),
    [user, loading, login, register, logout, forgotPassword]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
