const express = require("express");
const RentController = require("../controllers/RentController");

const router = express.Router();

router.get("/", RentController.rentList);
router.get("/:id", RentController.rentDetail);
router.post("/", RentController.rentRegister);
router.put("/:id", RentController.rentUpdate);
router.delete("/:id", RentController.rentDelete);

module.exports = router;