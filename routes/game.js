const express = require("express");
const Game = require("../models/Game");
const checkToken = require("../middleware/auth");

const router = express.Router();

// POST /api/save-game
// saves one completed game session to the db
// requires valid jwt - we get userId and username from the decoded token
// this way the client cant fake who the game belongs to
router.post("/save-game", checkToken, async (req, res) => {
  try {
    let { score, livesLeft, rounds, accuracy } = req.body;

    let newGame = new Game({
      userId: req.userData.id,
      username: req.userData.name,
      score,
      livesLeft,
      isWin: livesLeft > 0,
      rounds,
      accuracy,
      playDate: new Date(),
    });

    await newGame.save();
    res.json({ msg: "game saved" });
  } catch (err) {
    console.log("save game error:", err);
    res.status(500).json({ msg: "could not save game" });
  }
});

// POST /api/my-stats
// returns aggregated stats for the logged in user
router.post("/my-stats", checkToken, async (req, res) => {
  try {
    let games = await Game.find({ userId: req.userData.id });

    let totalScore = 0;
    let wins = 0;
    let totalAcc = 0;
    let totalRounds = 0;

    for (let g of games) {
      totalScore += g.score;
      if (g.isWin) wins++;
      totalAcc += g.accuracy || 0;
      totalRounds += g.rounds || 0;
    }

    let avgAccuracy =
      games.length > 0 ? Math.round(totalAcc / games.length) : 0;

    res.json({
      totalScore,
      gamesPlayed: games.length,
      wins,
      avgAccuracy,
      totalRounds,
    });
  } catch (err) {
    res.status(500).json({ msg: "error loading stats" });
  }
});

// POST /api/recent-games
// last 10 games for the history table on stats page
router.post("/recent-games", checkToken, async (req, res) => {
  try {
    let recent = await Game.find({ userId: req.userData.id })
      .sort({ playDate: -1 })
      .limit(10);
    res.json(recent);
  } catch (err) {
    res.status(500).json({ msg: "error loading recent games" });
  }
});

// GET /api/global-data
// public endpoint - no auth needed, shows site-wide stats on homepage
router.get("/global-data", async (req, res) => {
  try {
    const User = require("../models/User");
    let userCount = await User.countDocuments();
    let allGames = await Game.find({});

    let totalAcc = 0;
    let bestScore = 0;

    for (let g of allGames) {
      if (g.score > bestScore) bestScore = g.score;
      totalAcc += g.accuracy || 0;
    }

    let avgAcc =
      allGames.length > 0 ? Math.round(totalAcc / allGames.length) : 0;

    res.json({
      totalDetectives: userCount,
      gamesPlayed: allGames.length,
      avgAcc,
      topScore: bestScore,
    });
  } catch (err) {
    res.status(500).json({ msg: "error loading global stats" });
  }
});

// GET /api/leaderboard
// top 5 players by total cumulative score across all their games
router.get("/leaderboard", async (req, res) => {
  try {
    let allGames = await Game.find({});

    // build a map of username -> combined stats
    let players = {};

    for (let g of allGames) {
      if (!players[g.username]) {
        players[g.username] = {
          username: g.username,
          score: 0,
          totalAcc: 0,
          gameCount: 0,
        };
      }
      players[g.username].score += g.score;
      players[g.username].totalAcc += g.accuracy || 0;
      players[g.username].gameCount++;
    }

    let arr = Object.values(players).map((p) => ({
      username: p.username,
      score: p.score,
      accuracy: p.gameCount > 0 ? Math.round(p.totalAcc / p.gameCount) : 0,
    }));

    arr.sort((a, b) => b.score - a.score);

    res.json(arr.slice(0, 5));
  } catch (err) {
    res.status(500).json({ msg: "error loading leaderboard" });
  }
});

module.exports = router;
