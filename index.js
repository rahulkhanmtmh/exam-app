const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let questions = [];

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.post("/add-question", (req, res) => {
  questions.push(req.body);
  res.json({ message: "Added" });
});

app.get("/questions", (req, res) => {
  res.json(questions);
});

app.listen(5000, () => console.log("Server running"));
