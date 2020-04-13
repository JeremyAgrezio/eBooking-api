const express = require("express");
const UploadController = require("../controllers/UploadController");

const router = express.Router();

router.post("/single", UploadController.uploadFile);
router.post("/multiple", UploadController.uploadFiles);

module.exports = router;

