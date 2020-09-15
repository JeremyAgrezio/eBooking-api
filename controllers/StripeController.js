const mailer = require("../helpers/mailer");
const emails = require("../helpers/emails");
const { constants } = require("../helpers/constants");

const auth = require("../middlewares/jwt");
const Publication = require("../models/PublicationModel");
const Rent = require("../models/RentModel");
const Reservation= require("../models/ReservationModel");
const { body, check, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

const stripe = require("stripe")(process.env.SECRET_KEY_STRIPE);

// Reservation Schema
function ReservationData(data) {
    this.id = data._id;
    this.publication = data.publication;
    this.rent = {
        title: data.title,
        price: data.price,
        fullPrice: data.fullPrice,
    };
    this.start_at = data.start_at;
    this.end_at = data.end_at;
    this.tenant = data.tenant;
    this.createdAt = data.createdAt;
}

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
    check("startAt", "Start date must not be empty.").isLength({ min: 1 }).isISO8601(),
    check("finishAt", "End date must not be empty.").isLength({ min: 1 }).isISO8601(),
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
                currency: "eur",
                metadata: {
                    'publication_id': items.idPublication,
                    'start_at': items.startAt,
                    'finish_at': items.finishAt,
                    'tenant': JSON.stringify(req.user),
                }
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
        try {
            const paymentIntentId = req.body.paymentIntent;

            paymentStatus(paymentIntentId)
                .then(isAccepted => {
                    if (isAccepted) {
                       reservationProceed(res, paymentIntentId).then(async result => { return result });
                    } else {
                        return apiResponse.validationErrorWithData(res, "Payment error", {});
                    }
                })
                .catch(err => {
                    return apiResponse.ErrorResponse(res, err);
                })

        } catch (err) {
            //throw error in json response with status 500.
            return apiResponse.ErrorResponse(res, err);
        }
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

function calculateOrderAmount (res, items, callback) {

    findPublication(res, items, function(publication) {

        const reservation_start = new Date(items.startAt)
        const reservation_end = new Date(items.finishAt)

        const days = Math.round((reservation_end - reservation_start) / (1000 * 60 * 60 * 24));
        const price = (publication.rent.price * days) * 100;

        callback(price);
    });
};

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

async function paymentDetails (paymentIntentId) {
    return await stripe.paymentIntents.retrieve( paymentIntentId );
};

async function paymentStatus (paymentIntentId) {
    const paymentIntent = await paymentDetails( paymentIntentId );
    return paymentIntent.amount === paymentIntent.amount_received;
};

async function reservationProceed(res, paymentIntentId, callback) {
    try {
        const paymentIntent = await paymentDetails( paymentIntentId );
        const publicationId = paymentIntent.metadata.publication_id;
        const reservation_start = new Date(paymentIntent.metadata.start_at);
        const reservation_end = new Date(paymentIntent.metadata.finish_at);
        const totalDays = (reservation_end.getTime() - reservation_start.getTime()) / (1000 * 3600 * 24);
        const tenant = JSON.parse(paymentIntent.metadata.tenant);

        await Publication.findById(publicationId, (err, foundPublication) => {
            if (foundPublication === null) {
                callback(apiResponse.notFoundResponse(res, "Publication not exists with this id"));
            }
            else {
                const publication_start = new Date(foundPublication.start_at)
                const publication_end = new Date(foundPublication.end_at)

                if (reservation_start < publication_start || reservation_end > publication_end){
                    return apiResponse.unauthorizedResponse(res, "Reserved date(s) outside publication range");
                }
                else if (reservation_start >= reservation_end){
                    return apiResponse.unauthorizedResponse(res, "End date must be superior to start date");
                }

                Rent.findOne(
                    {
                        _id: foundPublication.rent,
                        reservations: {
                            //Check if any of the dates the rent has been reserved for overlap with the requested dates
                            $not: {
                                $elemMatch: {from: {$lt: reservation_end}, to: {$gt: reservation_start}}
                            }
                        }
                    },
                    (err, foundRent) => {
                        if (foundRent === null) {
                            return apiResponse.notFoundResponse(res, "Rent is already reserved at this dates");
                        }

                        const reservation = new Reservation(
                            { 	publication: publicationId,
                                start_at: reservation_start,
                                rent: {
                                    title: foundRent.title,
                                    price: foundRent.price,
                                    fullPrice: foundRent.price * totalDays,
                                },
                                end_at: reservation_end,
                                tenant: tenant,
                            });

                        //Save reservation.
                        reservation.save(err => {
                            if (err) {
                                return apiResponse.ErrorResponse(res, err);
                            }

                            const reservationData = new ReservationData(reservation);

                            //Update rent reservations.
                            foundRent.reservations.push({
                                _id: reservationData.id,
                                from: reservation_start,
                                to: reservation_end
                            });

                            foundRent.save(err => {
                                if (err) {
                                    return apiResponse.ErrorResponse(res, err);
                                }

                                // Html email body
                                const html = emails.reservationRegister(foundRent.title, reservation_start, reservation_end, foundRent.price)

                                mailer.send(
                                    constants.confirmEmails.from,
                                    tenant.email,
                                    "eBooking - Votre Réservation",
                                    html
                                ).then(() => {
                                    return apiResponse.successResponseWithData(res, "Reservation register Success.", reservationData);
                                }).catch(err => {
                                    return apiResponse.ErrorResponse(res, err);
                                });
                            });
                        });
                    }
                );
            }
        });
    } catch (err) {
        //throw error in json response with status 500.
        apiResponse.ErrorResponse(res, err);
    }
}
