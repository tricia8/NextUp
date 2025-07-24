// Import dependencies (ESM-style)
import express from "express";
import morgan from "morgan";
import * as admin from "firebase-admin";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import api from "./api.js";

dotenv.config();

// Create Express app
const app = express();
app.use(morgan("dev")); // HTTP request logger to monitor API traffic
app.use(express.json());
app.use("/api", api); // All routes in api are prefixed with /api

// Initialise app with admin privileges
if (!admin.apps?.length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true }); // Ignore undefined values

// Root route for basic API health check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the NextUp API" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default db;
