const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const router = express.Router();

const job = require("../controllers/job.controller");

router.get("/get", job.getAllJobs);

router.get("/get/:id", job.findOne);

router.use(verifyToken);

router.post("/", job.createJob);

router.post("/addFav/:id", job.addFav);
router.post("/removeFav/:id", job.removeFav);
router.get("/fav", job.findByFav);
router.get("/myJobs", job.findByUser);

module.exports = router;
