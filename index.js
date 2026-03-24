const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Question = require("./models/Question");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection string
const mongoURI =
  "mongodb+srv://admin:Rahul1994@cluster0.yej1g2d.mongodb.net/examDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Backend running with MongoDB");
});

app.post("/add-question", async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.json({ message: "Added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/delete-question/:id", async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/update-question/:id", async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk insert
app.post("/bulk-questions", async (req, res) => {
  try {
    const questions = req.body; // expects array of question objects
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: "Expected array of questions" });
    }
    const result = await Question.insertMany(questions);
    res.json({ message: "Bulk added", count: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
