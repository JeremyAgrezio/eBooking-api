const User = require("../models/UserModel");
const { body, check, validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const auth = require("../middlewares/jwt");
const bcrypt = require("bcrypt");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");

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
}

/**
 * User Profile.
 *
 * @returns {Object}
 */
exports.userProfil = [
	auth,
	function (req, res) {
		try {
			User.findById(req.user._id,{_id: 0, password: 0})
				.then((user)=>{
					if(user !== null){
						let userData = new UserData(user);
						return apiResponse.successResponseWithData(res, "Operation success", userData);
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
 * User profile update.
 *
 * @param {string}      firstName
 * @param {string}      lastName
 * @param {string}      address
 * @param {string}      city
 * @param {string}      country
 * @param {string}      postalCode
 * @param {string}      phone
 * @param {string}      email
 * @param {string}      picture
 * @param {string}      oldPassword
 * @param {string}      newPassword
 *
 * @returns {Object}
 */
exports.userUpdate = [
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
	check("oldPassword").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("Old password must be specified."),
	check("newPassword").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("New password must be specified."),
	body("firstName").escape(),
	body("lastName").escape(),
	body("address").escape(),
	body("city").escape(),
	body("country").escape(),
	body("postalCode").escape(),
	body("phone").escape(),
	body("email").escape(),
	body("oldPassword").escape(),
	body("newPassword").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				User.findById(req.user._id).then(user => {
					if (user) {
						//Check authorized user
						if (user._id.toString() !== req.user._id) {
							return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
						} else {
							//Compare given password with db's hash.
							bcrypt.compare(req.body.oldPassword,user.password,function (err,same) {
								if (!same) {
									return apiResponse.ErrorResponse(res, "Old password does not match.");
								} else {
									//hash input password
									bcrypt.hash(req.body.newPassword, 10, function (err, hash) {
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
												password: hash,
												isConfirmed: user.isConfirmed,
												_id: req.user._id
											});
										//update user password.
										User.findByIdAndUpdate(req.user, userModel, {}, function (err) {
											if (err) {
												return apiResponse.ErrorResponse(res, err);
											} else {
												let { id, password, ...userData } = new UserData(userModel);
												return apiResponse.successResponseWithData(res, "User profile update Success.", userData);
											}
										});
									})
								}
							})
						}
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
 * User password update.
 *
 * @param {string}      oldPassword
 * @param {string}      newPassword
 *
 * @returns {Object}
 */
exports.userPasswordUpdate = [
	auth,
	check("oldPassword").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("Old password must be specified."),
	check("newPassword").isLength({ min: 1 }).optional({ checkFalsy: true }).trim().withMessage("New password must be specified."),
	body("oldPassword").escape(),
	body("newPassword").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				User.findById(req.user._id).then(user => {
					if (user) {
						//Check authorized user
						if (user._id.toString() !== req.user._id) {
							return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
						} else {
							//Compare given password with db's hash.
							bcrypt.compare(req.body.oldPassword,user.password,function (err,same) {
								if (!same) {
									return apiResponse.ErrorResponse(res, "Old password does not match.");
								} else {
									//hash input password
									bcrypt.hash(req.body.newPassword, 10, function (err, hash) {
										const userModel = new User(
											{
												firstName: user.firstName,
												lastName: user.lastName,
												address: user.address,
												city: user.city,
												country: user.country,
												postalCode: user.postalCode,
												phone: user.phone,
												email: user.email,
												password: hash,
												isConfirmed: user.isConfirmed,
												_id: req.user._id
											});
										//update user.
										User.findByIdAndUpdate(req.user, userModel, {}, function (err) {
											if (err) {
												return apiResponse.ErrorResponse(res, err);
											} else {
												return apiResponse.successResponseWithData(res, "Password update Success.");
											}
										});
									})
								}
							})
						}
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
 * User Reset Password.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
exports.userPasswordReset = [
	check("email").trim().isEmail().withMessage("Email must be a valid email address."),
	body("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				User.findOne({email: req.body.email}).then(user => {
					if (user) {
						let otp = utility.randomNumber(6).toString();
						bcrypt.hash(otp,10,function(err, hash) {
							console.log(otp)
							console.log(hash)
							let userModel = new User(
								{
									firstName: user.firstName,
									lastName: user.lastName,
									address: user.address,
									city: user.city,
									country: user.country,
									postalCode: user.postalCode,
									phone: user.phone,
									email: user.email,
									password: hash,
									isConfirmed: user.isConfirmed,
									_id: user._id
								}
							);
							// Html email body
							let html = `<p>Password reset.</p><p>New password: ${otp}</p>`;
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from,
								req.body.email,
								"Password Reset",
								html
							).then(function(){
								// Update user.
								User.findOneAndUpdate({email: req.body.email}, userModel, {}, function (err) {
									if (err) {
										return apiResponse.ErrorResponse(res, err);
									} else {
										return apiResponse.successResponseWithData(res, "User Password Reset Success.");
									}
								});
							}).catch(err => {
								console.log(err);
								return apiResponse.ErrorResponse(res,err);
							}) ;
						});
					} else {
						return apiResponse.unauthorizedResponse(res, "Email address error.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}
];