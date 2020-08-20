const auth = require("../middlewares/jwt");
const Publication = require("../models/PublicationModel");
const { body, check, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

const stripe = require("stripe")(process.env.SECRET_KEY_STRIPE);

/**
 * Create Payment Intent.
 *
 * @param {string} idPublication
 * @param {string} startAt
 * @param {string} finishAt
 *
 * @returns {String}
 */
exports.createPaymentIntent = [
    auth,
    check("idPublication", "Publication ID must not be empty.").isLength({ min: 1 }),
    check("startAt", "Start date must not be empty.").isLength({ min: 1 }).isISO8601().toDate(),
    check("finishAt", "End date must not be empty.").isLength({ min: 1 }).isISO8601().toDate(),
    body("*").escape(),

    function (req, res) {
        const items  = req.body;

        if(!mongoose.Types.ObjectId.isValid(items.idPublication)){
            return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid publication ID");
        }

        calculateOrderAmount(res, items, async function(price) {

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: price,
                currency: "eur"
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            });
        });
    }
];

/**
 * Check Payment Status.
 *
 * @param {string} paymentIntent
 *
 * @returns {String}
 */
exports.checkPaymentStatus = [
    auth,
    check("paymentIntent", "Payment intent  must not be empty.").isLength({ min: 1 }),
    body("*").escape(),

    function (req, res) {
        const paymentIntentId = req.body.paymentIntent;

        paymentStatus(paymentIntentId)
            .then( (isAccepted) => {
                if (isAccepted) {
                    return apiResponse.successResponseWithData(res, "Reservation success", {});
                }

                return apiResponse.validationErrorWithData(res, "Payment error", {});
            })
            .catch( err => {
                console.error( 'fonction siRompue appelée : ' + err );
            })
    }
];

/**
 * Cancel Payment Intent.
 *
 * @param {string} paymentIntent
 *
 * @returns {String}
 */
exports.cancelPaymentIntent = [
    auth,
    check("paymentIntent", "Payment intent must not be empty.").isLength({ min: 1 }),
    body("*").escape(),

    async function (req, res) {
        const paymentIntentId = req.body.paymentIntent;
        const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

        if (paymentIntent.status === "canceled") {
            return apiResponse.successResponseWithData(res, "Payment's intent cancel success", {});
        }

        return apiResponse.validationErrorWithData(res, "Payment's intent error", {});
    }
];


function findPublication(res, items, callback) {
    try {
        Publication.findById(items.idPublication)
            .populate('rent', 'price')
            .then((publication)=>{
                if(publication !== null){
                    callback(publication);
                }
            });
    } catch (err) {
        //throw error in json response with status 500.
        return apiResponse.ErrorResponse(res, err);
    }
}

function calculateOrderAmount (res, items, callback) {

    findPublication(res, items, function(publication) {

        const reservation_start = new Date(items.startAt)
        const reservation_end = new Date(items.finishAt)

        const days = Math.round((reservation_end - reservation_start) / (1000 * 60 * 60 * 24));
        const price = (publication.rent.price * days) * 100;

        callback(price);
    });
};

async function paymentStatus (paymentIntentId) {
    const paymentIntent = stripe.paymentIntents.retrieve( paymentIntentId );
    return await paymentIntent.amount === paymentIntent.amount_received;
};

