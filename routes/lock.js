const express = require("express");
const LockController = require("../controllers/LockController");

const router = express.Router();

router.get("/", LockController.lockOpen);

module.exports = router;