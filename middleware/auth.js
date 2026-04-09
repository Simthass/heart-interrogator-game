const jwt = require("jsonwebtoken");

// middleware that checks the JWT in the Authorization header
// any route that needs the user to be logged in uses this
// it decodes the token and puts the user data on req.userData
function checkToken(req, res, next) {
  let authHead = req.headers.authorization;

  if (!authHead) {
    return res.status(401).json({ msg: "no token, access denied" });
  }

  // header format is "Bearer <token>" so split and grab index 1
  let tokenOnly = authHead.split(" ")[1];

  jwt.verify(tokenOnly, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "token invalid or expired" });
    }
    req.userData = decoded;
    next();
  });
}

module.exports = checkToken;
