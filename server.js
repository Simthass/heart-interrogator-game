require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");
const userRoutes = require("./routes/user");

const app = express();
app.use(express.json());
app.use(cors());

// connect to mongodb
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("mongodb connected"))
  .catch((err) => console.log("db error:", err));

// routes - split by concern so each file handles one area
app.use("/api", authRoutes); // register, login
app.use("/api", gameRoutes); // save game, stats, leaderboard
app.use("/api", userRoutes); // profile, password, delete

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("server running on http://localhost:" + PORT);
});
