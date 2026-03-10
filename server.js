const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

// connect to mongodb
mongoose
  .connect("mongodb://127.0.0.1:27017/heartGameDb")
  .then(() => console.log("db connected successfully..."))
  .catch((err) => console.log("db connection failed:", err));

// user schema
const UserSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  email: String,
  passHash: String,
  createdAt: { type: Date, default: Date.now },
});
const UserModel = mongoose.model("usersData", UserSchema);

// game data schema with timestamp
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
const GameModel = mongoose.model("gameHistory", GameSchema);

// ========== REGISTER ROUTE ==========
app.post("/api/reg", async (req, res) => {
  try {
    let { fullname, username, email, password, confirmPass } = req.body;

    // validate all fields
    if (!fullname || !username || !email || !password || !confirmPass) {
      return res.status(400).json({ msg: "please fill all fields brother" });
    }

    // check password match
    if (password !== confirmPass) {
      return res
        .status(400)
        .json({ msg: "passwords not matching check again" });
    }

    // password length check
    if (password.length < 8) {
      return res
        .status(400)
        .json({ msg: "password must be atleast 8 characters" });
    }

    // email validation simple
    if (!email.includes("@") || !email.includes(".")) {
      return res.status(400).json({ msg: "email is not valid format" });
    }

    // username min length
    if (username.length < 3) {
      return res
        .status(400)
        .json({ msg: "username must be atleast 3 characters" });
    }

    // convert to lowercase for case insensitive
    let usernameLower = username.toLowerCase().trim();
    let emailLower = email.toLowerCase().trim();

    // check if user exists
    let existingUser = await UserModel.findOne({
      $or: [{ email: emailLower }, { username: usernameLower }],
    });

    if (existingUser) {
      if (existingUser.email === emailLower) {
        return res
          .status(400)
          .json({ msg: "email already registered use different" });
      }
      if (existingUser.username === usernameLower) {
        return res
          .status(400)
          .json({ msg: "username taken choose another one" });
      }
    }

    // hash password
    let hashedPass = await bcrypt.hash(password, 10);

    // create new user
    let newUser = new UserModel({
      fullname: fullname,
      username: usernameLower,
      email: emailLower,
      passHash: hashedPass,
    });

    await newUser.save();

    res.json({
      msg: "registration successful",
      user: { id: newUser._id, name: newUser.username },
    });
  } catch (error) {
    console.log("registration error:", error);
    res.status(500).json({ msg: "server error try again" });
  }
});

// ========== LOGIN ROUTE ==========
app.post("/api/log", async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ msg: "enter username and password" });
    }

    let loginInput = username.toLowerCase().trim();

    // find user by username or email
    let user = await UserModel.findOne({
      $or: [{ username: loginInput }, { email: loginInput }],
    });

    if (!user) {
      return res.status(400).json({ msg: "user not found in system" });
    }

    // compare password
    let isValidPass = await bcrypt.compare(password, user.passHash);

    if (!isValidPass) {
      return res.status(400).json({ msg: "wrong password try again" });
    }

    res.json({
      msg: "login ok",
      user: {
        id: user._id,
        name: user.username,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("login error:", error);
    res.status(500).json({ msg: "server error" });
  }
});

// ========== SAVE GAME RESULT ==========
app.post("/api/save-game", async (req, res) => {
  try {
    let { userId, username, score, livesLeft, rounds, accuracy } = req.body;

    let newGame = new GameModel({
      userId: userId,
      username: username,
      score: score,
      livesLeft: livesLeft,
      isWin: livesLeft > 0 ? true : false,
      rounds: rounds,
      accuracy: accuracy,
      playDate: new Date(),
    });

    await newGame.save();
    res.json({ msg: "game saved to database" });
  } catch (error) {
    console.log("save game error:", error);
    res.status(500).json({ msg: "could not save game" });
  }
});

// ========== GET USER STATS ==========
app.post("/api/my-stats", async (req, res) => {
  try {
    let { userId } = req.body;

    let games = await GameModel.find({ userId: userId });

    let totalScore = 0;
    let wins = 0;
    let totalRounds = 0;

    for (let i = 0; i < games.length; i++) {
      totalScore += games[i].score;
      if (games[i].isWin) wins++;
      totalRounds += games[i].rounds || 0;
    }

    let avgAccuracy = 0;
    if (games.length > 0) {
      let totalAcc = 0;
      for (let i = 0; i < games.length; i++) {
        totalAcc += games[i].accuracy || 0;
      }
      avgAccuracy = Math.round(totalAcc / games.length);
    }

    res.json({
      totalScore: totalScore,
      gamesPlayed: games.length,
      wins: wins,
      avgAccuracy: avgAccuracy,
      totalRounds: totalRounds,
    });
  } catch (error) {
    console.log("stats error:", error);
    res.status(500).json({ msg: "error loading stats" });
  }
});

// ========== GET RECENT GAMES ==========
app.post("/api/recent-games", async (req, res) => {
  try {
    let { userId } = req.body;

    let recent = await GameModel.find({ userId: userId })
      .sort({ playDate: -1 })
      .limit(10);

    res.json(recent);
  } catch (error) {
    console.log("recent games error:", error);
    res.status(500).json({ msg: "error loading recent games" });
  }
});

// ========== GET USER INFO ==========
app.post("/api/user-info", async (req, res) => {
  try {
    let { userId } = req.body;

    let user = await UserModel.findById(userId);

    if (!user) {
      return res.status(400).json({ msg: "user not found" });
    }

    res.json({
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.log("user info error:", error);
    res.status(500).json({ msg: "error loading user info" });
  }
});

// ========== CHANGE PASSWORD ==========
app.post("/api/update-pass", async (req, res) => {
  try {
    let { userId, oldPass, newPass } = req.body;

    let user = await UserModel.findById(userId);

    if (!user) {
      return res.status(400).json({ msg: "user not found" });
    }

    let isValid = await bcrypt.compare(oldPass, user.passHash);

    if (!isValid) {
      return res.status(400).json({ msg: "old password is wrong" });
    }

    if (newPass.length < 8) {
      return res
        .status(400)
        .json({ msg: "new password too short need 8 chars" });
    }

    let newHash = await bcrypt.hash(newPass, 10);
    user.passHash = newHash;
    await user.save();

    res.json({ msg: "password changed successfully" });
  } catch (error) {
    console.log("password change error:", error);
    res.status(500).json({ msg: "error changing password" });
  }
});

app.listen(3000, () => {
  console.log("server running on http://localhost:3000");
});
