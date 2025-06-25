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
app.post('/upload', async (req, res) => {
  try {
    const fileStr = req.body.data;
    const folder = req.body.folder;

    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder,
    });
    res.json({ url: uploadResponse.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).send('Upload failed');
  }
});