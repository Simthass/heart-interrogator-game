const mongoose = require("mongoose");

// game schema - one document per game session played
// accuracy is 0-100 percentage calculated before saving
const GameSchema = new mongoose.Schema({
  userId: String,
  username: String,
  score: Number,
  livesLeft: Number,
  isWin: Boolean,
  rounds: Number,
  accuracy: Number,
  playDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("gameHistory", GameSchema);
