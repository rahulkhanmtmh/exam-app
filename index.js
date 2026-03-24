const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Question = require("./models/Question");

const app = express();

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// 🔐 Secret key (change later)
const JWT_SECRET = "mysecretkey";

// ==========================
// 🧑‍💻 REGISTER
// ==========================
app.post("/register", async (req, res) => {
  try {
    const { schoolName, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.json({ message: "User already exists" });

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
// 🔐 LOGIN
// ==========================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

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
// 🔒 MIDDLEWARE (PROTECT ROUTES)
// ==========================
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ==========================
// 📚 ADD QUESTION (PROTECTED)
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
// 📚 GET QUESTIONS (ONLY USER)
// ==========================
app.get("/questions", auth, async (req, res) => {
  try {
    const questions = await Question.find({ userId: req.userId });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));
