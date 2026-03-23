const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*"
}));

app.use(express.json());

// Temporary storage
let questions = [];

// Test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

// Add question
app.post("/add-question", (req, res) => {
  const q = req.body;
  questions.push(q);
  res.json({ message: "Question added" });
});

// Get all questions
app.get("/questions", (req, res) => {
  res.json(questions);
});

app.listen(5000, () => console.log("Server running"));
