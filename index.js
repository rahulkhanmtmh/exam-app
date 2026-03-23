const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Question = require("./models/Question"); // Import model

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
const mongoURI = "mongodb+srv://admin:Rahul1994@cluster0.yej1g2d.mongodb.net/examDB?retryWrites=true&w=majority&appName=Cluster0";
// Note: I added 'examDB' as the database name. You can change it if you want.

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Backend running with MongoDB");
});

// Add a new question
app.post("/add-question", async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.json({ message: "Added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all questions
app.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a question by its MongoDB _id
app.delete("/delete-question/:id", async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a question by its MongoDB _id
app.put("/update-question/:id", async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
