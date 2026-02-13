import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";

dotenv.config();

const app = express();

/* =========================
   ✅ MIDDLEWARE (ORDER MATTERS)
========================= */

// Body parser
app.use(express.json());

// ✅ CORS must come BEFORE routes
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle preflight requests
app.options("*", cors());

/* =========================
   ✅ ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

/* =========================
   ✅ DATABASE CONNECTION
========================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

/* =========================
   ✅ SERVER START
========================= */

app.listen(5000, () => {
  console.log("🔥 Server running on port 5000");
});
