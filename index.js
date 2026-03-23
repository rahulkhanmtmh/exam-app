const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.post("/upload", (req, res) => {
  res.json({ text: "OCR coming soon" });
});

app.listen(5000, () => console.log("Server running"));
