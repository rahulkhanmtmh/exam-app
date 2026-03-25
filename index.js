// ==========================
// ENV CONFIG
// ==========================
require("dotenv").config();

// ==========================
// IMPORTS
// ==========================
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const Tesseract = require("tesseract.js");

const User = require("./models/User");
const Question = require("./models/Question");

// ==========================
// APP INIT
// ==========================
const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// FILE UPLOAD (OCR)
// ==========================
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ==========================
// DB CONNECT
// ==========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  });

// ==========================
// SECRET
// ==========================
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ==========================
// AUTH MIDDLEWARE
// ==========================
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ==========================
// REGISTER
// ==========================
app.post("/register", async (req, res) => {
  try {
    const { schoolName, email, password } = req.body;

    if (!schoolName || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      schoolName,
      email,
      password: hashed,
    });

    await user.save();

    res.json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// LOGIN
// ==========================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login success",
      token,
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// ADD QUESTION
// ==========================
app.post("/add-question", auth, async (req, res) => {
  try {
    const question = new Question({
      ...req.body,
      userId: req.userId,
    });

    await question.save();

    res.json({ message: "Question added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// GET QUESTIONS
// ==========================
app.get("/questions", auth, async (req, res) => {
  try {
    const questions = await Question.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// DELETE QUESTION
// ==========================
app.delete("/delete-question/:id", auth, async (req, res) => {
  try {
    const deleted = await Question.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// UPDATE QUESTION
// ==========================
app.put("/update-question/:id", auth, async (req, res) => {
  try {
    const updated = await Question.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({ message: "Updated successfully", updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// OCR ROUTE (MAIN + FALLBACK)
// ==========================
app.post("/ocr", auth, upload.single("image"), async (req, res) => {
  let imagePath;

  try {
    if (!req.file) {
      return res.status(400).json({ text: "No image uploaded" });
    }

    imagePath = req.file.path;

    // convert to base64
    const base64Image =
      "data:image/jpeg;base64," +
      fs.readFileSync(imagePath, "base64");

    let parsedText = "";

    try {
      // ===== PRIMARY OCR (OCR.space) =====
      const response = await axios.post(
        "https://api.ocr.space/parse/image",
        {
          base64Image: base64Image,
          language: "eng",
          isOverlayRequired: false,
          apikey: process.env.OCR_API_KEY,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      parsedText =
        response.data?.ParsedResults?.[0]?.ParsedText;

      if (!parsedText || parsedText.trim() === "") {
        throw new Error("Empty OCR result");
      }

    } catch (err) {
      console.log("⚠️ OCR.space failed → Using Tesseract fallback");

      // ===== FALLBACK OCR =====
      const result = await Tesseract.recognize(
        imagePath,
        "eng+ben"
      );

      parsedText = result.data.text;
    }

    res.json({ text: parsedText });

  } catch (err) {
    console.error("OCR Error:", err.message);
    res.status(500).json({ text: "OCR failed" });

  } finally {
    // ===== SAFE CLEANUP =====
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
});

// ==========================
// HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  res.send("✅ API Running");
});

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

// ==========================
// SERVER START
// ==========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
