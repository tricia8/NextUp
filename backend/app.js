// Import dependencies (ESM-style)
import express from "express";
import morgan from "morgan";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { cloudinary } from './cloudinary';

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


// Cloudinary
app.post('/signature', (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = req.body.folder;

  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    timestamp,
    signature,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
});