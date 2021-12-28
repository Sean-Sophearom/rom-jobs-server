const express = require("express");
const router = express.Router();

const user = require("../controllers/user.controller");
const verifyToken = require("../middlewares/verifyToken");

//login and register no need token
router.post("/auth/register", user.register);
router.post("/auth/login", user.login);
router.get("/stats", user.getStats);

router.post("/message", user.addMsg);

router.use(verifyToken);

//update pw need token to get user_id as well as confirm the user.
router.put("/auth/updatePW", user.updatePassword);

router.post("/user/profileInfo", user.saveProfileInfo);
router.get("/user/profileInfo", user.findProfileInfo);

module.exports = router;
