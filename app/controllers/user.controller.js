const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// create and save new user aka register account
exports.register = (req, res) => {
  if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

  //destructing the req.body
  const { name, password, accType } = req.body;

  //check if user already exists
  User.findByName(name, async (err, data) => {
    if (data) {
      return res.status(400).json({ message: `Account with username ${name} already exists.` });
    } else if (err?.type === "not_found") {
      //hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      //create a user
      const user = new User({ name, password: hashedPassword, accType });

      //save to db
      User.create(user, (err, data) => {
        if (err) return res.status(400).json({ message: err.message });
        //removing the password so we don't send it back
        res.status(201).json({ ...data, password: undefined });
      });
    } else {
      return res.status(500).json({ message: "Internal Server Error." });
    }
  });
};

exports.login = (req, res) => {
  if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

  //destructing the req.body
  const { name, password } = req.body;

  //find user from db
  User.findByName(name, async (err, data) => {
    if (err?.type === "not_found") return res.status(400).json({ message: `No user with name ${name} found.` });

    //compare the password
    const validPassword = await bcrypt.compare(password, data.password);
    if (validPassword) {
      //remove password from the data from db
      const dataToSendBack = { ...data, password: undefined };

      //if the password is valid, create a token and send it back
      const token = jwt.sign(dataToSendBack, process.env.JWT_SECRET);
      res.status(200).json({ ...dataToSendBack, token });
    } else {
      res.status(401).json({ message: `Incorrect password for account ${name}.` });
    }
  });
};
