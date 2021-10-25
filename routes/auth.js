const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = require("express").Router();
const User = require("../schema/user");

const registerFunc = async (req, res) => {
  try {
    const { username, password, accType } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "User already exists." });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await new User({ username, password: hashedPassword, accType }).save();
    res.status(201).json({ ...newUser._doc, password: undefined });
  } catch (error) {
    res.json(error);
  }
};

const loginFunc = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) res.status(404).json({ message: `No user with username ${username} found.` });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Incorrect password." });
    // create and assign a jwt
    const userInfoToSendBack = { ...user._doc, password: undefined };
    const token = jwt.sign({ username: user.username, _id: user._id, accType: user.accType }, process.env.TOKEN_SECRET);
    res.status(200).json({ ...userInfoToSendBack, token });
  } catch (error) {
    res.json(error);
  }
};

router.post("/register", registerFunc);
router.post("/login", loginFunc);

module.exports = router;
