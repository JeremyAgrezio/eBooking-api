const express = require("express");
const UserController = require("../controllers/UserController");

const router = express.Router();

router.get("/", UserController.userProfil);
router.post("/update", UserController.userUpdate);
router.post("/updatePassword", UserController.userPasswordUpdate);
router.post("/resetPassword", UserController.userPasswordReset);

module.exports = router;