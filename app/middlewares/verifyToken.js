const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  //using let cause we'll have to remove the BEARER part later
  let token = req.header("Authorization");

  //check if user has provided a token or not
  if (!token) return res.status(401).json({ message: "unauthorized" });

  //check if provided token starts with the string BEARER
  if (!token.startsWith("BEARER ")) return res.status(401).json({ message: "unauthorized" });

  //remove the BEARER part
  token = token.split(" ")[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...verified, token };
    next();
  } catch (error) {
    res.status(400).json(error);
  }
};
