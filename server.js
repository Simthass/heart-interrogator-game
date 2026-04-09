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

// middleware for token - checks Authorization header and decodes JWT
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("server running on http://localhost:" + PORT);
});
