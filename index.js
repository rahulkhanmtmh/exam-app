const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");

const User = require("./models/User");
const Question = require("./models/Question");

const app = express();

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors());
app.use(express.json());

// ==========================
// FILE UPLOAD (OCR)
// ==========================
const upload = multer({ dest: "uploads/" });

// ==========================
// DB CONNECT
// ==========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// ==========================
// SECRET
// ==========================
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

// ==========================
// AUTH MIDDLEWARE
// ==========================
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ==========================
// REGISTER
// ==========================
app.post("/register", async (req, res) => {
  try {
    const { schoolName, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ message: "User already exists" });
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

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ message: "Wrong password" });
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

    res.json({ message: "Added" });
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
    await Question.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// UPDATE QUESTION
// ==========================
app.put("/update-question/:id", auth, async (req, res) => {
  try {
    await Question.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// 📷 OCR ROUTE (FREE)
// ==========================
app.post("/ocr", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ text: "No image uploaded" });
    }

    const imagePath = req.file.path;

    const base64Image =
      "data:image/jpeg;base64," +
      fs.readFileSync(imagePath, "base64");

    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      {
        apikey: process.env.OCR_API_KEY, // 🔑 from Render
        language: "eng+ben",
        isOverlayRequired: false,
        base64Image: base64Image,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const parsedText =
      response.data?.ParsedResults?.[0]?.ParsedText ||
      "⚠️ No text detected. Try clearer image.";

    // delete uploaded file
    fs.unlinkSync(imagePath);

    res.json({ text: parsedText });

  } catch (err) {
    console.log(err);
    res.status(500).json({ text: "OCR failed" });
  }
});

// ==========================
// SERVER START
// ==========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
