const auth = require("../middlewares/jwt");

// This is a sample test API key. Sign in to see examples pre-filled with your key.
const stripe = require("stripe")(process.env.SECRET_KEY_STRIPE);

const calculateOrderAmount = items => {
    // Replace this constant with a calculation of the order's amount
    // Calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client

    return 1400;
};

/**
 * Create Payment Intent.
 *
 * @returns {String}
 */
exports.createPaymentIntent = [
    auth,
    async function (req, res) {
        const { items } = req.body;

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(items),
            currency: "eur"
        });

        res.send({
            clientSecret: paymentIntent.client_secret
        });
    }
];
