const express = require("express");
const StripeController = require("../controllers/StripeController");

const router = express.Router();

router.post("/create-payment-intent", StripeController.createPaymentIntent);
router.post("/check-payment-status", StripeController.checkPaymentStatus);
router.post("/cancel-payment-intent", StripeController.cancelPaymentIntent);

module.exports = router;
