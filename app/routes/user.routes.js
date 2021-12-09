const express = require("express");
const router = express.Router();

const user = require("../controllers/user.controller");
const verifyToken = require("../middlewares/verifyToken");

//login and register no need token
router.post("/register", user.register);
router.post("/login", user.login);

router.use(verifyToken);

//update pw need token to get user_id as well as confirm the user.
router.post("/updatePW", user.updatePassword);

module.exports = router;
