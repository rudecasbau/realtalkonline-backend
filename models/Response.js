
const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  qId: String,
  user: String,
  content: String,
  likes: { type: Number, default: 0 },
  deepens: { type: Number, default: 0 },
  comments: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Response", responseSchema);
