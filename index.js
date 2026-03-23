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

mongoose.connect("mongodb+srv://admin:Rahul1994@cluster0.yej1g2d.mongodb.net/?appName=Cluster0 ")

app.delete("/delete-question/:index", (req, res) => {
  const i = req.params.index;
  questions.splice(i, 1);
  res.json({ message: "Deleted" });
});

app.put("/update-question/:index", (req, res) => {
  const i = req.params.index;
  questions[i] = req.body;
  res.json({ message: "Updated" });
});

app.listen(5000, () => console.log("Server running"));
