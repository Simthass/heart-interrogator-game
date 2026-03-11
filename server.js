require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// grabbing the secret key from env
const mySecretKey = process.env.JWT_SECRET;

// connect to mongodb
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("db connected successfully..."))
  .catch((err) => console.log("db connection failed:", err));

// schemas
const UserSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  email: String,
  passHash: String,
  createdAt: { type: Date, default: Date.now },
});
const UserModel = mongoose.model("usersData", UserSchema);

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

// middleware for token
function checkTokenMiddleware(req, res, next) {
  let authHead = req.headers.authorization;
  if (!authHead) {
    return res.status(401).json({ msg: "no token found bro access denied" });
  }
  let tokenOnly = authHead.split(" ")[1];
  jwt.verify(tokenOnly, mySecretKey, (err, decodedData) => {
    if (err) {
      return res.status(401).json({ msg: "token fake or expired" });
    }
    req.userData = decodedData;
    next();
  });
}

// routes
app.post("/api/reg", async (req, res) => {
  try {
    let { fullname, username, email, password, confirmPass } = req.body;
    if (!fullname || !username || !email || !password || !confirmPass) {
      return res.status(400).json({ msg: "please fill all fields brother" });
    }
    if (password !== confirmPass) {
      return res
        .status(400)
        .json({ msg: "passwords not matching check again" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ msg: "password must be atleast 8 characters" });
    }

    let usernameLower = username.toLowerCase().trim();
    let emailLower = email.toLowerCase().trim();

    let existingUser = await UserModel.findOne({
      $or: [{ email: emailLower }, { username: usernameLower }],
    });

    if (existingUser) {
      return res.status(400).json({ msg: "user already there" });
    }

    let hashedPass = await bcrypt.hash(password, 10);
    let newUser = new UserModel({
      fullname: fullname,
      username: usernameLower,
      email: emailLower,
      passHash: hashedPass,
    });
    await newUser.save();

    let myToken = jwt.sign(
      { id: newUser._id, name: newUser.username },
      mySecretKey,
      { expiresIn: "15d" },
    );

    res.json({
      msg: "registration successful",
      token: myToken,
      user: { name: newUser.username },
    });
  } catch (error) {
    res.status(500).json({ msg: "server error try again" });
  }
});

app.post("/api/log", async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ msg: "enter username and password" });
    }

    let loginInput = username.toLowerCase().trim();
    let user = await UserModel.findOne({
      $or: [{ username: loginInput }, { email: loginInput }],
    });

    if (!user) {
      return res.status(400).json({ msg: "user not found in system" });
    }

    let isValidPass = await bcrypt.compare(password, user.passHash);
    if (!isValidPass) {
      return res.status(400).json({ msg: "wrong password try again" });
    }

    let myToken = jwt.sign({ id: user._id, name: user.username }, mySecretKey, {
      expiresIn: "15d",
    });

    res.json({
      msg: "login ok",
      token: myToken,
      user: { name: user.username },
    });
  } catch (error) {
    res.status(500).json({ msg: "server error" });
  }
});

app.post("/api/save-game", checkTokenMiddleware, async (req, res) => {
  try {
    let { score, livesLeft, rounds, accuracy } = req.body;
    let safeUserId = req.userData.id;
    let safeUsername = req.userData.name;

    let newGame = new GameModel({
      userId: safeUserId,
      username: safeUsername,
      score: score,
      livesLeft: livesLeft,
      isWin: livesLeft > 0 ? true : false,
      rounds: rounds,
      accuracy: accuracy,
      playDate: new Date(),
    });

    await newGame.save();
    res.json({ msg: "game saved securely to database" });
  } catch (error) {
    res.status(500).json({ msg: "could not save game" });
  }
});

app.post("/api/my-stats", checkTokenMiddleware, async (req, res) => {
  try {
    let safeUserId = req.userData.id;
    let games = await GameModel.find({ userId: safeUserId });

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
    res.status(500).json({ msg: "error loading stats" });
  }
});

app.post("/api/recent-games", checkTokenMiddleware, async (req, res) => {
  try {
    let safeUserId = req.userData.id;
    let recent = await GameModel.find({ userId: safeUserId })
      .sort({ playDate: -1 })
      .limit(10);
    res.json(recent);
  } catch (error) {
    res.status(500).json({ msg: "error loading recent games" });
  }
});

app.post("/api/user-info", checkTokenMiddleware, async (req, res) => {
  try {
    let safeUserId = req.userData.id;
    let user = await UserModel.findById(safeUserId);
    if (!user) return res.status(400).json({ msg: "user not found" });

    res.json({
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ msg: "error loading user info" });
  }
});

app.post("/api/update-pass", checkTokenMiddleware, async (req, res) => {
  try {
    let { oldPass, newPass } = req.body;
    let safeUserId = req.userData.id;
    let user = await UserModel.findById(safeUserId);

    if (!user) return res.status(400).json({ msg: "user not found" });

    let isValid = await bcrypt.compare(oldPass, user.passHash);
    if (!isValid) return res.status(400).json({ msg: "old password is wrong" });
    if (newPass.length < 8)
      return res
        .status(400)
        .json({ msg: "new password too short need 8 chars" });

    let newHash = await bcrypt.hash(newPass, 10);
    user.passHash = newHash;
    await user.save();

    res.json({ msg: "password changed successfully" });
  } catch (error) {
    res.status(500).json({ msg: "error changing password" });
  }
});

app.get("/api/global-data", async (req, res) => {
  try {
    let allUsersCount = await UserModel.countDocuments();
    let allGames = await GameModel.find({});

    let totalGames = allGames.length;
    let bestScore = 0;
    let totalAcc = 0;

    for (let i = 0; i < allGames.length; i++) {
      if (allGames[i].score > bestScore) {
        bestScore = allGames[i].score;
      }
      totalAcc += allGames[i].accuracy || 0;
    }

    let realAvgAcc = 0;
    if (totalGames > 0) {
      realAvgAcc = Math.round(totalAcc / totalGames);
    }

    res.json({
      totalDetectives: allUsersCount,
      gamesPlayed: totalGames,
      avgAcc: realAvgAcc,
      topScore: bestScore,
    });
  } catch (err) {
    res.status(500).json({ msg: "server error for global stats" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    let allGames = await GameModel.find({});
    let playersObj = {};

    // loop through all games and group them by user to get real total stats
    for (let i = 0; i < allGames.length; i++) {
      let g = allGames[i];

      // if user not in object yet, add them
      if (!playersObj[g.username]) {
        playersObj[g.username] = {
          username: g.username,
          totalScore: 0,
          totalAcc: 0,
          gameCount: 0,
        };
      }

      // add up their stats
      playersObj[g.username].totalScore += g.score;
      playersObj[g.username].totalAcc += g.accuracy || 0;
      playersObj[g.username].gameCount += 1;
    }

    let leaderArr = [];

    // calculate real average accuracy for each player
    for (let key in playersObj) {
      let p = playersObj[key];
      if (p.gameCount > 0) {
        p.realAvgAccuracy = Math.round(p.totalAcc / p.gameCount);
      } else {
        p.realAvgAccuracy = 0;
      }
      leaderArr.push(p);
    }

    // sort array by total score highest first
    leaderArr.sort((a, b) => b.totalScore - a.totalScore);

    // only send top 5 players to frontend
    let top5 = leaderArr.slice(0, 5);
    res.json(top5);
  } catch (e) {
    console.log("leaderboard error", e);
    res.status(500).json({ msg: "cant get leaderboard" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("server running on http://localhost:" + PORT);
});
