const express = require("express");
const LockController = require("../controllers/LockController");

const router = express.Router();

router.get("/", LockController.lockList);
router.get("/:id", LockController.lockDetail);
router.post("/", LockController.lockRegister);
router.put("/:id", LockController.lockUpdate);
router.delete("/:id", LockController.lockDelete);
router.get("/", LockController.lockOpen);

module.exports = router;