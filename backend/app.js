// Import dependencies (ESM-style)
import express from "express";
import morgan from "morgan";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Create Express app
const app = express();
app.use(morgan("dev")); // HTTP request logger to monitor API traffic
app.use(express.json());

// Initialise app with admin privileges
initializeApp({
  credential: applicationDefault(),
  databaseURL: process.env.databaseURL,
});

const db = getFirestore();

// Root route for basic API health check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the NextUp API" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
