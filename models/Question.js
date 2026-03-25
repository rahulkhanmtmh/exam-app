const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  cls: String,
  subject: String,
  chapter: String,

  text: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ["MCQ", "SHORT", "LONG", "TRUE_FALSE", "MATCH"],
    default: "MCQ"
  },

  marks: {
    type: Number,
    default: 1
  },

  options: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  correctAnswer: {
    type: String,
    default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
