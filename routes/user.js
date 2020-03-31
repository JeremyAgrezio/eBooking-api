const express = require("express");
const UserController = require("../controllers/UserController");

const router = express.Router();

router.get("/", UserController.userProfil);
router.put("/update", UserController.userUpdate);
router.put("/updatePassword", UserController.userPasswordUpdate);
router.post("/resetPassword", UserController.userPasswordReset);

module.exports = router;