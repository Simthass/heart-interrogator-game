const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Game = require("../models/Game");
const checkToken = require("../middleware/auth");

const router = express.Router();

// POST /api/user-info
// returns profile info for the settings and stats pages
router.post("/user-info", checkToken, async (req, res) => {
  try {
    let user = await User.findById(req.userData.id);
    if (!user) return res.status(400).json({ msg: "user not found" });

    res.json({
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ msg: "error loading user" });
  }
});

// POST /api/update-pass
// change password - must prove old password first before we update it
router.post("/update-pass", checkToken, async (req, res) => {
  try {
    let { oldPass, newPass } = req.body;
    let user = await User.findById(req.userData.id);

    if (!user) return res.status(400).json({ msg: "user not found" });

    let isValid = await bcrypt.compare(oldPass, user.passHash);
    if (!isValid) return res.status(400).json({ msg: "old password is wrong" });

    if (newPass.length < 8) {
      return res.status(400).json({ msg: "new password too short" });
    }

    user.passHash = await bcrypt.hash(newPass, 10);
    await user.save();

    res.json({ msg: "password changed" });
  } catch (err) {
    res.status(500).json({ msg: "error changing password" });
  }
});

// POST /api/delete-account
// permanently deletes account + all game history
// requires password confirmation so its not accidental
router.post("/delete-account", checkToken, async (req, res) => {
  try {
    let { password } = req.body;
    if (!password)
      return res.status(400).json({ msg: "enter password to confirm" });

    let user = await User.findById(req.userData.id);
    if (!user) return res.status(400).json({ msg: "user not found" });

    let valid = await bcrypt.compare(password, user.passHash);
    if (!valid) return res.status(400).json({ msg: "wrong password" });

    // delete all game records first then the user
    await Game.deleteMany({ userId: req.userData.id });
    await User.findByIdAndDelete(req.userData.id);

    console.log("account deleted:", req.userData.id);
    res.json({ msg: "account deleted" });
  } catch (err) {
    console.log("delete error:", err);
    res.status(500).json({ msg: "server error" });
  }
});

module.exports = router;
