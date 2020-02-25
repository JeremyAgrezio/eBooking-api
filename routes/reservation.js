const express = require("express");
const ReservationController = require("../controllers/ReservationController");

const router = express.Router();

router.get("/", ReservationController.reservationList);
router.get("/:id", ReservationController.reservationDetail);
router.post("/", ReservationController.reservationRegister);
router.put("/:id", ReservationController.reservationUpdate);
router.delete("/:id", ReservationController.reservationDelete);

module.exports = router;