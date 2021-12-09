//imports
require("dotenv").config();
const express = require("express");
const cors = require("cors");

//initialize the app
const app = express();

//middleware for parsing req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//cors
app.use(cors());

//import routes
const userRouter = require("./app/routes/user.routes");
const jobRouter = require("./app/routes/job.routes");

//use routes
app.use("/api/auth", userRouter);
app.use("/api/job", jobRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server listening on port ${PORT}`));
