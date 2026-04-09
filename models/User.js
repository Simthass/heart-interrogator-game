const mongoose = require("mongoose");

// user schema - stores account info
// passHash stores the bcrypt hashed version, never the real password
const UserSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  email: String,
  passHash: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("usersData", UserSchema);
