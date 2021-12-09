const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const router = express.Router();

const cv = require("../controllers/cv.controller");

router.get("/:id", cv.findByUser);

router.use(verifyToken);

router.post("/", cv.createCV);

router.put("/", cv.updateByUser);

router.delete("/", cv.deleteByUser);

module.exports = router;
