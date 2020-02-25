const express = require("express");
const PublicationController = require("../controllers/PublicationController");

const router = express.Router();

router.get("/", PublicationController.publicationList);
router.get("/:id", PublicationController.publicationDetail);
router.post("/", PublicationController.publicationRegister);
router.put("/:id", PublicationController.publicationUpdate);
router.delete("/:id", PublicationController.publicationDelete);

module.exports = router;