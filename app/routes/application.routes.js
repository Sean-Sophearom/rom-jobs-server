const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const router = express.Router();

const application = require("../controllers/application.controller");

router.use(verifyToken);

router.post("/", application.create);
router.get("/", application.find);
router.get("/:id", application.findById);
router.put("/:id", application.updateStatus);

module.exports = router;
