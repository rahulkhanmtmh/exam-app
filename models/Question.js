const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  // 📚 BASIC INFO
  cls: String,
  subject: String,
  chapter: String,

  // ❓ QUESTION
  text: {
    type: String,
    required: true
  },

  // 🧠 TYPE OF QUESTION
  type: {
    type: String,
    enum: ["MCQ", "SHORT", "LONG", "TRUE_FALSE"],
    default: "MCQ"
  },

  // 📝 MARKS
  marks: {
    type: Number,
    default: 1
  },

  // 🔥 MCQ OPTIONS
  options: {
    A: String,
    B: String,
    C: String,
    D: String
  },

  // ✅ CORRECT ANSWER
  correctAnswer: {
    type: String, // "A" / "B" / "C" / "D" / "True" / "False"
    default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
