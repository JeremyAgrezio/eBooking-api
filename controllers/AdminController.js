const User = require("../models/UserModel");
const Rent = require("../models/RentModel");
const Reservation = require("../models/ReservationModel");
const { body, check, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const mongoose = require("mongoose");

// user Schema
function UserData(data) {
	this.id = data._id;
	this.firstName = data.firstName;
	this.lastName = data.lastName;
	this.address = data.address;
	this.city = data.city;
	this.country = data.country;
	this.postalCode = data.postalCode;
	this.phone = data.phone;
	this.email = data.email;
	this.picture = data.picture;
	this.password = data.password;
	this.isConfirmed = data.isConfirmed;
	this.role = data.role;
	this.status = data.status;
}

// Rent Schema
function RentData(data) {
	this.id = data._id;
	this.title= data.title;
	this.description = data.description;
	this.capacity = data.capacity;
	this.price = data.price;
	this.area = data.area;
	this.pictures = data.pictures;
	this.address = data.address;
	this.city = data.city;
	this.country = data.country;
	this.postalCode = data.postalCode;
	this.is_published = data.is_published;
	this.is_rented = data.is_rented;
	this.associatedLock = data.associatedLock;
	this.createdAt = data.createdAt;
}

// Reservation Schema
function ReservationData(data) {
	this.id = data._id;
	this.publication = data.publication;
	this.tenant = data.tenant;
	this.createdAt = data.createdAt;
}

/**
 * Users List.
 *
 * @returns {Object}
 */
exports.usersList = [
	auth,
	function (req, res) {
		try {
			User.findById(req.user._id)
				.then((user)=> {
					if (user.role === "ADMIN") {
						User.find()
							.then((users) => {
								if (users.length > 0) {
									return apiResponse.successResponseWithData(res, "Operation success", users);
								} else {
									return apiResponse.successResponseWithData(res, "Operation success", []);
								}
							});
					} else {
						return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
					}
				});
		}
		catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * User Edit.
 *
 * @param {string} 		id
 * @param {string}      role
 *
 * @returns {Object}
 */
exports.userEdit = [
	auth,
	check("firstName").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	check("lastName").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	check("address").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("Address must be specified."),
	check("city").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("City must be specified."),
	check("country").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("Country must be specified."),
	check("postalCode").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("Postal code must be specified."),
	check("phone").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("Phone must be specified.")
		.isAlphanumeric().withMessage("Phone has non-alphanumeric characters."),
	check("email").optional({ checkFalsy: true }).trim().isEmail().withMessage("Email must be a valid email address."),
	check("picture").optional({ checkFalsy: true }).trim().isURL().withMessage("Picture must be a valid URL."),
	check("role").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("Role must be specified.")
		.isString().withMessage("Role must be a string."),
	check("status").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("Status must be specified.")
		.isBoolean().withMessage("Status must be a boolean."),
	body("*").escape(),

	(req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				User.findById(req.user._id)
					.then((user)=> {
						if (user.role === "ADMIN") {
							if(!mongoose.Types.ObjectId.isValid(req.params.id)){
								return apiResponse.successResponseWithData(res, "Operation success", {});
							} else {
								User.findById(req.params.id).then(user => {
									const userModel = new User(
										{
											firstName: req.body.firstName,
											lastName: req.body.lastName,
											address: req.body.address,
											city: req.body.city,
											country: req.body.country,
											postalCode: req.body.postalCode,
											phone: req.body.phone,
											email: req.body.email,
											password: user.password,
											isConfirmed: user.isConfirmed,
											role: req.body.role,
											status: req.body.status,
										});
									//update user role.
									User.findByIdAndUpdate(req.params.id, userModel, {}, function (err) {
										if (err) {
											return apiResponse.ErrorResponse(res, err);
										} else {
											let {id, password, ...userData} = new UserData(userModel);
											return apiResponse.successResponseWithData(res, "User profile edit Success.", userData);
										}
									});
								});
							}
						} else {
							return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
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
 * Last week users registered.
 *
 * @returns {Object}
 */
exports.lastWeekUsersRegistered = [
	auth,
	function (req, res) {
		try {
			User.findById(req.user._id)
				.then((user)=> {
					if (user.role === "ADMIN") {
						const date = new Date(); // Date now
						const anteriorDate = date.setDate(date.getDate() - 7); // Date now - 7 days
						const dateString = date.toISOString().split('T')[0];
						const anteriorDateString = anteriorDate.toISOString().split('T')[0];

						User.find(
							{
								createdAt: {
									$gte: anteriorDateString,
									$lt: dateString
								}
							}
						)
						.then((users) => {
							if (users.length > 0) {
								return apiResponse.successResponseWithData(res, "Operation success", users);
							} else {
								return apiResponse.successResponseWithData(res, "Operation success", []);
							}
						});
					} else {
						return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
					}
				});
		}
		catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Reservations List.
 * 
 * @returns {Object}
 */
exports.reservationList = [
	auth,
	function (req, res) {
		try {
			User.findById(req.user._id)
				.then((user)=> {
					if (user.role === "ADMIN") {
						Reservation.find()
							.then((reservations) => {
								if (reservations.length > 0) {
									return apiResponse.successResponseWithData(res, "Operation success", reservations);
								} else {
									return apiResponse.successResponseWithData(res, "Operation success", []);
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

/**
 * Last week reservations.
 *
 * @returns {Object}
 */
exports.lastWeekReservations = [
	auth,
	function (req, res) {
		try {
			User.findById(req.user._id)
				.then((user)=> {
					if (user.role === "ADMIN") {
						const date = new Date(); // Date now
						const anteriorDate = date.setDate(date.getDate() - 7); // Date now - 7 days
						const dateString = date.toISOString().split('T')[0];
						const anteriorDateString = anteriorDate.toISOString().split('T')[0];

						Reservation.find(
							{
								createdAt: {
									$gte: anteriorDateString,
									$lt: dateString
								}
							}
						)
						.then((reservations) => {
							if (reservations.length > 0) {
								return apiResponse.successResponseWithData(res, "Operation success", reservations);
							} else {
								return apiResponse.successResponseWithData(res, "Operation success", []);
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

