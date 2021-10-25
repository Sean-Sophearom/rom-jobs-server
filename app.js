require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// initialize some stuffs
const app = express();
const PORT = process.env.PORT || 5000;

// just some bodyparser that I dont fully understand yet
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

//connection to db
mongoose
  .connect(process.env.CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("mongoose connected successfully");
    app.listen(PORT, () => console.log("server listening on port " + PORT));
  })
  .catch((err) => console.error(err));
