import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import "dotenv/config";

import connectDB from "./config/db.js";

import listingRoutes from "./routes/listing.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

import errorMiddleware from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

// CORS configuration
const origins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins,
    credentials: false,
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Parse JSON requests
app.use(express.json());

// Serve uploaded images
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");

app.use("/uploads", express.static(uploadDir));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

// API routes
app.use("/api/listings", listingRoutes);

app.use("/api/uploads", uploadRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Global error handling
app.use(errorMiddleware);

// Connect database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
