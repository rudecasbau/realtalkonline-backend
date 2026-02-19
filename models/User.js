const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },

  // 👇 AÑADE ESTO
  avatar: {
    type: String,
    default: "🙂"
  }

});

module.exports = mongoose.model("User", userSchema);


