const express = require("express");
const AdminController = require("../controllers/AdminController");

const router = express.Router();

router.get("/users", AdminController.usersList);
router.get("/lastWeekUsers", AdminController.lastWeekUsersRegistered);
router.get("/reservations", AdminController.reservationList);
router.get("/lastWeekReservations", AdminController.lastWeekReservations);
router.put("/userEdit", AdminController.userEdit);

module.exports = router;