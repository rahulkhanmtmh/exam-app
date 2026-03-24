const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Question = require("./models/Question");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB connection using ENV
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Test route
app.get("/", (req, res) => {
  res.send("Backend running with MongoDB 🚀");
});

// ✅ Add Question
app.post("/add-question", async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.json({ message: "Question Added ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get All Questions
app.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete Question (using MongoDB _id)
app.delete("/delete-question/:id", async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update Question (using MongoDB _id)
app.put("/update-question/:id", async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Updated ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Bulk Insert Questions
app.post("/bulk-questions", async (req, res) => {
  try {
    const questions = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: "Expected array of questions" });
    }

    const result = await Question.insertMany(questions);
    res.json({ message: "Bulk added ✅", count: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
