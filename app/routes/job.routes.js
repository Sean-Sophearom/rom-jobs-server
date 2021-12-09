const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const router = express.Router();

const job = require("../controllers/job.controller");

router.use(verifyToken);

router.get("/", job.getAllJobs);

router.post("/", job.createJob);

router.get("/:id", job.findOne);

module.exports = router;
