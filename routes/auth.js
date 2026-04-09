const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// POST /api/reg
// creates a new account, hashes the password, returns a jwt token straight away
// so the user is logged in right after registering
router.post("/reg", async (req, res) => {
  try {
    let { fullname, username, email, password, confirmPass } = req.body;

    if (!fullname || !username || !email || !password || !confirmPass) {
      return res.status(400).json({ msg: "please fill all fields" });
    }

    if (password !== confirmPass) {
      return res.status(400).json({ msg: "passwords dont match" });
    }

    if (password.length < 8) {
      return res.status(400).json({ msg: "password needs at least 8 chars" });
    }

    let usernameLower = username.toLowerCase().trim();
    let emailLower = email.toLowerCase().trim();

    // check if username or email already taken
    let existing = await User.findOne({
      $or: [{ email: emailLower }, { username: usernameLower }],
    });

    if (existing) {
      return res.status(400).json({ msg: "username or email already exists" });
    }

    // bcrypt with salt 10 - secure enough and not too slow
    let hashed = await bcrypt.hash(password, 10);

    let newUser = new User({
      fullname,
      username: usernameLower,
      email: emailLower,
      passHash: hashed,
    });

    await newUser.save();

    // sign a jwt so they can log straight in after registering
    let token = jwt.sign(
      { id: newUser._id, name: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "15d" },
    );

    res.json({
      msg: "registration successful",
      token,
      user: { name: newUser.username },
    });
  } catch (err) {
    console.log("register error:", err);
    res.status(500).json({ msg: "server error" });
  }
});

// POST /api/log
// checks username/email + password, returns jwt token
router.post("/log", async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ msg: "enter username and password" });
    }

    let input = username.toLowerCase().trim();

    // allow login with either username or email
    let user = await User.findOne({
      $or: [{ username: input }, { email: input }],
    });

    if (!user) {
      return res.status(400).json({ msg: "user not found" });
    }

    // compare the plain password against the stored hash
    let valid = await bcrypt.compare(password, user.passHash);
    if (!valid) {
      return res.status(400).json({ msg: "wrong password" });
    }

    let token = jwt.sign(
      { id: user._id, name: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "15d" },
    );

    res.json({
      msg: "login ok",
      token,
      user: { name: user.username },
    });
  } catch (err) {
    console.log("login error:", err);
    res.status(500).json({ msg: "server error" });
  }
});

module.exports = router;
