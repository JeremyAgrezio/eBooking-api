const express = require("express");
const UserController = require("../controllers/UserController");

const router = express.Router();

router.get("/", UserController.userProfil);
router.post("/update", UserController.userUpdate);

module.exports = router;