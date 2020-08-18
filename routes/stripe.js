const express = require("express");
const StripeController = require("../controllers/StripeController");

const router = express.Router();

router.post("/create-payment-intent", StripeController.createPaymentIntent);

module.exports = router;
