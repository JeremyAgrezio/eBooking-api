const UserModel = require("../models/UserModel");
const { body, check, validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");

/**
 * User registration.
 *
 * @param {string}      firstName
 * @param {string}      lastName
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.register = [
	// Validate fields.
	check("firstName").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	check("lastName").isLength({ min: 1 }).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	check("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
			return UserModel.findOne({email : value}).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),
	check("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	// Sanitize fields.
	body("firstName").escape(),
	body("lastName").escape(),
	body("email").escape(),
	body("password").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				//hash input password
				bcrypt.hash(req.body.password,10,function(err, hash) {
					// generate OTP for confirmation
					let otp = utility.randomNumber(4);
					// Create User object with escaped and trimmed data
					let user = new UserModel(
						{
							firstName: req.body.firstName,
							lastName: req.body.lastName,
							email: req.body.email,
							password: hash,
							confirmOTP: otp
						}
					);
					// Html email body
					let html = `<div style="background-color: #49A69A">
								  <img src="https://www.zupimages.net/up/20/33/hu8k.png" alt="logo"height="30" style="padding-top: 15px; padding-bottom: 10px; padding-left: 20px">
								</div>
								<div style="background-color: #2D404E; padding-top: 15px; padding-bottom: 25px">
								 <table style="width:100%">
								   <tr>
									<th>
									  <h1 style="color: #fff">Votre code de confirmation</h1>
									  <p style="color: #fff">
									  Saisissez le code de confirmation pour activer votre compte.
									  </p>
									  <p style="  border: none;
												  color: #2D404E;
												  padding: 10px 15px;
												  text-align: center;
												  display: inline-block;
												  font-size: 16px;
												  margin: 4px 2px;
												  background-color: #fff;
												  border-radius: 25px;">
										${otp}
									</p>
									</th>
									<th>
									  <img src="https://zupimages.net/up/20/33/9esh.png" alt="logo" height="150px">
									</th>
								  </tr>
								 </table>
								</div>
								<div style="background-color: #FFFFFF; padding-top: 15px; padding-bottom: 10px">
								 <table style="width:100%">
								   <tr>
									<th>
									  <img src="https://zupimages.net/up/20/33/asu3.jpg" alt="logo" height="200px">
									</th>
									 <th>
									  <h2 style="color:#2D404E">
										N'oubliez pas !
										<br>
										L'application est dispobible
									  </h2>
									   <img src="https://buddy.world/wp-content/uploads/2018/05/App-Store-Google-Play-Badges-Vector.jpg" alt="logo" height="50px">
									</th>
								  </tr>
								 </table>
								</div>`;
					// Send confirmation email
					mailer.send(
						constants.confirmEmails.from,
						req.body.email,
						"eBooking - Confirmez votre compte",
						html
					).then(function(){
						// Save user.
						user.save(function (err) {
							if (err) { return apiResponse.ErrorResponse(res, err); }
							let userData = {
								_id: user._id,
								firstName: user.firstName,
								lastName: user.lastName,
								email: user.email
							};
							return apiResponse.successResponseWithData(res,"Registration Success.", userData);
						});
					}).catch(err => {
						return apiResponse.ErrorResponse(res,err);
					}) ;
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
	check("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	check("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	body("email").escape(),
	body("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				UserModel.findOne({email : req.body.email}).then(user => {
					if (user) {
						//Compare given password with db's hash.
						bcrypt.compare(req.body.password,user.password,function (err,same) {
							if(same){
								//Check account confirmation.
								if(user.isConfirmed){
									// Check User's account active or not.
									if(user.status) {
										const userData = {
											_id: user._id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
											role: user.role,
										};
										// Prepare JWT token for authentication
										const jwtPayload = userData;
										const jwtData = {
											expiresIn: process.env.JWT_TIMEOUT_DURATION,
										};
										const secret = process.env.JWT_SECRET;
										//Generated JWT token with Payload and secret.
										userData.token = jwt.sign(jwtPayload, secret, jwtData);
										return apiResponse.successResponseWithData(res,"Login Success.", userData);
									}else {
										return apiResponse.unauthorizedResponse(res, "Account is not active. Please contact admin.");
									}
								}else{
									return apiResponse.unauthorizedResponse(res, "Account is not confirmed. Please confirm your account.");
								}
							}else{
								return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
							}
						});
					}else{
						return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
exports.verifyConfirm = [
	check("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	check("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
	body("email").escape(),
	body("otp").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				let query = {email : req.body.email};
				UserModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if(!user.isConfirmed){
							//Check account confirmation.
							if(user.confirmOTP === req.body.otp){
								//Update user as confirmed
								UserModel.findOneAndUpdate(query, {
									isConfirmed: 1,
									confirmOTP: null
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								});
								return apiResponse.successResponse(res,"Account confirmed success.");
							}else{
								return apiResponse.unauthorizedResponse(res, "Otp does not match");
							}
						}else{
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					}else{
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * Resend Confirm otp.
 *
 * @param {string} email
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
	check("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				const email = {email : req.body.email};
				UserModel.findOne(email).then(user => {
					if (user) {
						//Check already confirm or not.
						if(!user.isConfirmed){
							// Generate otp
							const otp = utility.randomNumber(4);
							// Html email body
							const html = `<div style="background-color: #49A69A">
												<img src="https://www.zupimages.net/up/20/33/hu8k.png" alt="logo"height="30" style="padding-top: 15px; padding-bottom: 10px; padding-left: 20px">
											</div>
											<div style="background-color: #2D404E; padding-top: 15px; padding-bottom: 25px">
												<table style="width:100%">
													<tr>
														<th>
															<h1 style="color: #fff">Votre code de confirmation</h1>
															<p style="color: #fff">
																Saisissez le code de confirmation pour activer votre compte.
															</p>
															<p style="  border: none;
																  color: #2D404E;
																  padding: 10px 15px;
																  text-align: center;
																  display: inline-block;
																  font-size: 16px;
																  margin: 4px 2px;
																  background-color: #fff;
																  border-radius: 25px;">
																`+otp+`
															</p>
														</th>
														<th>
															<img src="https://zupimages.net/up/20/33/9esh.png" alt="logo" height="150px">
														</th>
													</tr>
												</table>
											</div>
											<div style="background-color: #FFFFFF; padding-top: 15px; padding-bottom: 10px">
												<table style="width:100%">
													<tr>
														<th>
															<img src="https://zupimages.net/up/20/33/asu3.jpg" alt="logo" height="200px">
														</th>
														<th>
															<h2 style="color:#2D404E">
																N'oubliez pas !
																<br>
																	L'application est dispobible
															</h2>
															<img src="https://buddy.world/wp-content/uploads/2018/05/App-Store-Google-Play-Badges-Vector.jpg" alt="logo" height="50px">
														</th>
													</tr>
												</table>
											</div>`;
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from,
								req.body.email,
								"eBooking - Confirmez votre compte",
								html
							).then(function(){
								user.isConfirmed = 0;
								user.confirmOTP = otp;
								// Save user.
								user.save(function (err) {
									if (err) { return apiResponse.ErrorResponse(res, err); }
									return apiResponse.successResponse(res,"Confirm otp sent.");
								});
							});
						}else{
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					}else{
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];
