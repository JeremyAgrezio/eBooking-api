const Rent = require("../models/RentModel");
const Publication = require("../models/PublicationModel");
const Reservation= require("../models/ReservationModel");
const { body, check, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

// Reservation Schema
function ReservationData(data) {
	this.id = data._id;
	this.publication = data.publication;
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
			Reservation.find({tenant: req.user._id}, {'_id': 1, 'publication': 1, 'tenant': 1})
			.populate('publication', {'_id': 0, 'start_at': 1, 'end_at': 1})
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
			Reservation.findOne({_id: req.params.id,tenant: req.user._id},"_id publication tenant createdAt")
			.populate('publication', {'createdAt': 0, 'updatedAt': 0, '__v': 0})
			.then((reservation)=>{
				if(reservation !== null){
					let reservationData = new ReservationData(reservation);
					return apiResponse.successResponseWithData(res, "Operation success", reservationData);
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
			const reservation = new Reservation(
				{ 	publication: req.body.publication,
					tenant: req.user,
				});

			console.log(req.body.publication);

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				Publication.findById(req.body.publication, function (err, foundPublication) {
					if (foundPublication=== null) {
						return apiResponse.notFoundResponse(res, "Publication not exists with this id");
					} else {
						Rent.findById(foundPublication.rent, function (err, foundRent) {
							if (foundRent === null) {
								return apiResponse.notFoundResponse(res, "Rent not exists with this id");
							} else if (foundRent.is_rented === true) {
								return apiResponse.unauthorizedResponse(res, "Rent is already reserved");
							} else {
								//update rent.
								const update = {is_rented: true};

								Rent.findByIdAndUpdate(foundPublication.rent, update, {}, function (err) {
									if (err) {
										return apiResponse.ErrorResponse(res, err);
									} else {
										//Save reservation.
										reservation.save(function (err) {
											if (err) {
												return apiResponse.ErrorResponse(res, err);
											}
											let reservationData = new ReservationData(reservation);
											return apiResponse.successResponseWithData(res, "Reservation register Success.", reservationData);
										});
									}
								});
							}
						});
					}
				});
			}
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
			const reservation = new Reservation(
				{ 	publication: req.body.publication,
					tenant: req.user,
					_id:req.params.id
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				if(!mongoose.Types.ObjectId.isValid(req.params.id)){
					return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
				}else{
					Reservation.findById(req.params.id, function (err, foundReservation) {
						if(foundReservation === null){
							return apiResponse.notFoundResponse(res,"Reservation not exists with this id");
						}else{
							//Check authorized user
							if(foundReservation.tenant.toString() !== req.user._id){
								return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
							}else{
								Publication.findById(req.body.publication, function (err, foundPublication) {
									if (foundPublication=== null) {
										return apiResponse.notFoundResponse(res, "Publication not exists with this id");
									} else {
										Rent.findById(foundPublication.rent, function (err, foundRent) {
											if (foundRent === null) {
												return apiResponse.notFoundResponse(res, "Rent not exists with this id");
											} else {
												//update rent.
												const update = {is_rented: true};

												Rent.findByIdAndUpdate(foundPublication.rent, update, {}, function (err) {
													if (err) {
														return apiResponse.ErrorResponse(res, err);
													} else {
														//update reservation.
														Reservation.findByIdAndUpdate(req.params.id, reservation, {}, function (err) {
															if (err) {
																return apiResponse.ErrorResponse(res, err);
															} else {
																let reservationData = new ReservationData(reservation);
																return apiResponse.successResponseWithData(res, "Reservation update Success.", reservationData);
															}
														});
													}
												});
											}
										});
									}
								});
							}
						}
					});
				}
			}
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
					}else{
						Publication.findById(foundReservation.publication, function (err, foundPublication) {
							if (foundPublication=== null) {
								return apiResponse.notFoundResponse(res, "Publication not exists with this id");
							} else {
								Rent.findById(foundPublication.rent, function (err, foundRent) {
									if (foundRent === null) {
										return apiResponse.notFoundResponse(res, "Rent not exists with this id");
									} else {
										//update rent.
										const update = {is_rented: false};

										Rent.findByIdAndUpdate(foundPublication.rent, update, {}, function (err) {
											if (err) {
												return apiResponse.ErrorResponse(res, err);
											} else {
												//delete reservation.
												Reservation.findByIdAndRemove(req.params.id, function (err) {
													if (err) {
														return apiResponse.ErrorResponse(res, err);
													} else {
														return apiResponse.successResponse(res, "Reservation delete Success.");
													}
												});
											}
										});
									}
								});
							}
						});
					}
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];