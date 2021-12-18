//imports
require("dotenv").config();
const express = require("express");
const cors = require("cors");
// const sql = require("./app/models/db");

// (async () => {
//   const [res] = await sql.execute("truncate table application");

//   console.log(res);
// })();

//initialize the app
const app = express();

//middleware for parsing req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//cors
app.use(cors());

//import routes
const userRouter = require("./app/routes/user.routes");
const cvRouter = require("./app/routes/cv.routes");
const applicationRouter = require("./app/routes/application.routes");
const jobRouter = require("./app/routes/job.routes");

//use routes
app.use("/api/job", jobRouter);
app.use("/api/cv", cvRouter);
app.use("/api/app", applicationRouter);
app.use("/api/", userRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server listening on port ${PORT}`));
