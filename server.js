const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
// idk why but need cors to work for frontend fetch
app.use(cors());

// connect to mongo local db
mongoose
  .connect("mongodb://localhost:27017/heartGameDb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("db connected ok"))
  .catch((err) => console.log("db error", err));

// make schemas here
const UserSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  email: String,
  passHash: String,
});
const UserModel = mongoose.model("usersData", UserSchema);

const GameSchema = new mongoose.Schema({
  userId: String,
  score: Number,
  livesLeft: Number,
  isWin: Boolean,
  playDate: { type: Date, default: Date.now },
});
const GameModel = mongoose.model("gameHistory", GameSchema);

// --- ROUTES START HERE ---

// register user
app.post("/api/reg", async (req, res) => {
  try {
    let checkUser = await UserModel.findOne({ email: req.body.email });
    if (checkUser) return res.status(400).json({ msg: "email already there" });

    // encrypt the pass
    let hashedPass = await bcrypt.hash(req.body.password, 10);

    let userNew = new UserModel({
      fullname: req.body.fullname,
      username: req.body.username,
      email: req.body.email,
      passHash: hashedPass,
    });
    await userNew.save();

    res.json({
      msg: "user created ok",
      user: { id: userNew._id, name: userNew.username },
    });
  } catch (e) {
    console.log("error in reg", e);
    res.status(500).json({ msg: "server error" });
  }
});

// login route
app.post("/api/log", async (req, res) => {
  try {
    let found = await UserModel.findOne({ username: req.body.username });
    if (!found) return res.status(400).json({ msg: "user not found" });

    let passOk = await bcrypt.compare(req.body.password, found.passHash);
    if (!passOk) return res.status(400).json({ msg: "wrong password" });

    res.json({
      msg: "login success",
      user: { id: found._id, name: found.username },
    });
  } catch (e) {
    res.status(500).json({ msg: "server error" });
  }
});

// save game result
app.post("/api/save-game", async (req, res) => {
  try {
    let newGameRecord = new GameModel({
      userId: req.body.userId,
      score: req.body.score,
      livesLeft: req.body.livesLeft,
      isWin: req.body.livesLeft > 0 ? true : false,
    });
    await newGameRecord.save();
    res.json({ msg: "saved game ok" });
  } catch (e) {
    res.status(500).json({ msg: "error saving game" });
  }
});

// fetch stats for profile page
app.post("/api/my-stats", async (req, res) => {
  try {
    let allGames = await GameModel.find({ userId: req.body.userId });

    let totScore = 0;
    let casesSolved = 0;

    // loop to calculate totals
    for (let i = 0; i < allGames.length; i++) {
      totScore += allGames[i].score;
      if (allGames[i].isWin == true) {
        casesSolved += 1;
      }
    }

    let acc = 0;
    if (allGames.length > 0) {
      acc = Math.round((casesSolved / allGames.length) * 100);
    }

    res.json({
      totalScore: totScore,
      solved: casesSolved,
      accuracy: acc,
      gamesPlayed: allGames.length,
    });
  } catch (e) {
    res.status(500).json({ msg: "error getting stats" });
  }
});

// change pass
app.post("/api/update-pass", async (req, res) => {
  try {
    let u = await UserModel.findById(req.body.userId);
    let checkOld = await bcrypt.compare(req.body.oldPass, u.passHash);

    if (!checkOld) {
      return res.status(400).json({ msg: "old password wrong" });
    }

    let newHash = await bcrypt.hash(req.body.newPass, 10);
    u.passHash = newHash;
    await u.save();

    res.json({ msg: "password changed" });
  } catch (e) {
    res.status(500).json({ msg: "error change pass" });
  }
});

app.listen(3000, () => {
  console.log("server running on port 3000");
});
