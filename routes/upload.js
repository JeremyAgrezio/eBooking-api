const express = require("express");
const UploadController = require("../controllers/UploadController");

const router = express.Router();

// router.get("/", UploadController.uploadList);
// router.get("/:id", UploadController.uploadDetail);
router.post("/", UploadController.uploadFile);
// router.put("/:id", UploadController.uploadUpdate);
// router.delete("/:id", UploadController.uploadDelete);

module.exports = router;

