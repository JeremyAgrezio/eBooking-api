const Rent = require("../models/RentModel");
const Publication = require("../models/PublicationModel");
const Reservation= require("../models/ReservationModel");
const { body, check, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const mongoose = require("mongoose");
const mailer = require("../helpers/mailer");
const emails = require("../helpers/emails");
const { constants } = require("../helpers/constants");
mongoose.set("useFindAndModify", false);

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
 * Reservation List.
 *
 * @returns {Object}
 */
exports.reservationList = [
	auth,
	function (req, res) {
		try {
			Reservation.find({tenant: req.user._id}, {'createdAt': 0})
			.populate({
				path: 'publication',
				populate: {
					path: 'rent',
					select: {'pictures': 1, '_id': 0},
				},
				select: '_id'
			})
			.then((reservations)=>{
				if(reservations.length > 0){
					return apiResponse.successResponseWithData(res, "Operation success", reservations);
				}else{
					return apiResponse.successResponseWithData(res, "Operation success", []);
				}
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Today Reservation List.
 *
 * @returns {Object}
 */
exports.reservationListToday = [
	auth,
	function (req, res) {
		try {
			Reservation.find(
				{
					tenant: req.user._id,
					start_at: {$lte: new Date()},
					end_at: {$gte: new Date()},
				},
				{'createdAt': 0}
			)
				.populate({
					path: 'publication',
					populate: {
						path: 'rent',
						select: {'pictures': 1, '_id': 0},
					},
					select: '_id'
				})
				.then((reservations)=>{
					if(reservations.length > 0){
						return apiResponse.successResponseWithData(res, "Operation success", reservations);
					}else{
						return apiResponse.successResponseWithData(res, "Operation success", []);
					}
				});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Reservation Detail.
 *
 * @param {string} id
 *
 * @returns {Object}
 */
exports.reservationDetail = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.successResponseWithData(res, "Operation success", {});
		}
		try {
			Reservation.findOne({_id: req.params.id,tenant: req.user._id})
			.populate({
				path: 'publication',
				populate: {
					path: 'rent',
					select: {'pictures': 1, '_id': 0},
				},
				select: {'_id': 1, 'start_at': 1, 'end_at': 1}
			})
			.then((reservation)=>{
				if(reservation !== null){
					return apiResponse.successResponseWithData(res, "Operation success", reservation);
				}else{
					return apiResponse.successResponseWithData(res, "Operation success", {});
				}
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Reservation register.
 *
 * @param {string} publication
 *
 * @returns {Object}
 */
exports.reservationRegister = [
	auth,
	check("publication", "Publication must not be empty.").isLength({ min: 1 }).trim(),
	body("*").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			const reservation_start = new Date(req.body.start_at)
			const reservation_end = new Date(req.body.end_at)

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}

			Publication.findById(req.body.publication, function (err, foundPublication) {
				if (foundPublication === null) {
					return apiResponse.notFoundResponse(res, "Publication not exists with this id");
				}
				else {
					const publication_start = new Date(foundPublication.start_at)
					const publication_end = new Date(foundPublication.end_at)

					if (reservation_start < publication_start || reservation_end > publication_end){
						return apiResponse.unauthorizedResponse(res, "Reserved date(s) outside publication range");
					}

					const totalDays = (reservation_end.getTime() - reservation_start.getTime()) / (1000 * 3600 * 24);

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
						function (err, foundRent) {
							if (foundRent === null) {
								return apiResponse.notFoundResponse(res, "Rent is already reserved at this dates");
							}

							const reservation = new Reservation(
								{ 	publication: req.body.publication,
									start_at: req.body.start_at,
									rent: {
										title: foundRent.title,
										price: foundRent.price,
										fullPrice: foundRent.price * totalDays,
									},
									end_at: req.body.end_at,
									tenant: req.user,
								});

							//Save reservation.
							reservation.save(function (err) {
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

								foundRent.save(function (err) {
									if (err) {
										return apiResponse.ErrorResponse(res, err);
									}

									// Html email body
									const html = emails.reservationRegister(foundRent.title, req.body.start_at, req.body.end_at, foundRent.price)

									mailer.send(
										constants.confirmEmails.from,
										req.user.email,
										"eBooking - Votre Réservation",
										html
									).then(function () {
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
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Reservation update.
 *
 * @param {string} publication
 *
 * @returns {Object}
 */
exports.reservationUpdate = [
	auth,
	check("publication", "Publication must not be empty.").isLength({ min: 1 }).trim(),
	body("*").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			const reservation_start = new Date(req.body.start_at)
			const reservation_end = new Date(req.body.end_at)

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
				return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
			}

			Reservation.findById(req.params.id, function (err, foundReservation) {
				if(foundReservation === null){
					return apiResponse.notFoundResponse(res,"Reservation not exists with this id");
				}
				else if(foundReservation.tenant.toString() !== req.user._id){
					return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
				}

				Publication.findById(req.body.publication, function (err, foundPublication) {
					const publication_start = new Date(foundPublication.start_at)
					const publication_end = new Date(foundPublication.end_at)

					if (foundPublication=== null) {
						return apiResponse.notFoundResponse(res, "Publication not exists with this id");
					}
				    else if(reservation_start < publication_start || reservation_end > publication_end) {
						return apiResponse.unauthorizedResponse(res, "Reserved date(s) outside publication range");
					}

					const totalDays = (reservation_end.getTime() - reservation_start.getTime()) / (1000 * 3600 * 24);

					Rent.findOneAndUpdate(
						{
							_id: foundPublication.rent,
							reservations: {
								//Check if any of the dates the rent has been reserved for overlap with the requested dates
								$not: {
									$elemMatch: {_id: {$ne: foundReservation},from: {$lt: reservation_end}, to: {$gt: reservation_start}}
								}
							},
							"reservations._id": foundReservation.id
						},
						{$set: {'reservations.$.from': reservation_start, 'reservations.$.to': reservation_end,}}, // list fields you like to change
						{'new': true, 'safe': true, 'upsert': true},
						(err, foundRent) => {
							if (foundRent === null || foundRent === undefined) {
								return apiResponse.notFoundResponse(res, "Rent is already reserved at this dates");
							}

							const reservation = new Reservation(
								{ 	publication: req.body.publication,
									rent: {
										title: foundRent.title,
										price: foundRent.price,
										fullPrice: foundRent.price * totalDays,
									},
									start_at: req.body.start_at,
									end_at: req.body.end_at,
									tenant: req.user,
									_id:req.params.id
								});

							foundReservation.updateOne(
								reservation,
								(err) => {
									if (err) { return apiResponse.ErrorResponse(res, err) }

									// Html email body
									const html = emails.reservationUpdate(foundRent.title, req.body.start_at, req.body.end_at, foundRent.price)

									mailer.send( constants.confirmEmails.from, req.user.email, "eBooking - Mise à jour de votre Réservation", html )
									.then(function () {
										const reservationData = new ReservationData(reservation);
										return apiResponse.successResponseWithData(res, "Reservation update Success.", reservationData);
									})
									.catch(err => {	return apiResponse.ErrorResponse(res, err);	});
								}
							);
						}
					);
				});
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Reservation Delete.
 *
 * @param {string} id
 *
 * @returns {Object}
 */
exports.reservationDelete = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
		}
		try {
			Reservation.findById(req.params.id, function (err, foundReservation) {
				if(foundReservation === null){
					return apiResponse.notFoundResponse(res,"Reservation not exists with this id");
				}else{
					//Check authorized user
					if(foundReservation.tenant.toString() !== req.user._id){
						return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
					}

					Rent.findOneAndUpdate(
						{ "reservations._id": foundReservation.id },
						{ "$pull": { "reservations": { "_id": foundReservation.id } }},
						{ safe: true, multi: true } ,
						function (err, foundRent) {
							if (foundRent === null) {
								return apiResponse.notFoundResponse(res, "Rent not exists with this id");
							} else {
								//delete reservation.
								foundReservation.deleteOne(
									(err) => {
										if (err) {
											return apiResponse.ErrorResponse(res, err);
										} else {
											return apiResponse.successResponse(res, "Reservation delete Success.");
										}
									}
								);
							}
					});
				}
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];
