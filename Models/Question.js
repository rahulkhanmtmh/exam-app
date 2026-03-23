const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  cls: String,
  subject: String,
  chapter: String,
  text: String,
  marks: Number
});

module.exports = mongoose.model('Question', questionSchema);
