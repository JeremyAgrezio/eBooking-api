const Rent = require("../models/RentModel");
const Publication = require("../models/PublicationModel");
const { body, check, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

// Publication Schema
function PublicationData(data) {
	this.id = data._id;
	this.rent= data.rent;
	this.start_at = data.start_at;
	this.end_at = data.end_at;
	this.createdAt = data.createdAt;
}

// Rent Schema
function RentData(data) {
	this.title= data.title;
	this.description = data.description;
	this.capacity = data.capacity;
	this.price = data.price;
	this.area = data.area;
	this.pictures = data.pictures;
	this.address = data.address;
	this.city = data.city;
	this.country = data.country;
}

/**
 * Publication List.
 * 
 * @returns {Object}
 */
exports.publicationList = [
	//auth,
	function (req, res) {
		try {
			Publication.find({},"_id rent start_at end_at")
			.then((publications)=>{
				if(publications.length > 0){
					return apiResponse.successResponseWithData(res, "Operation success", publications);
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
 * Publication Detail.
 * 
 * @param {string} id
 * 
 * @returns {Object}
 */
exports.publicationDetail = [
	//auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.successResponseWithData(res, "Operation success", {});
		}
		try {
			Publication.findOne({_id: req.params.id},"_id start_at end_at createdAt updatedAt").then((publication)=>{
				if(publication !== null){
					Rent.findOne(publication.rent,"title description capacity price area pictures address city country").then((rent)=> {
						if (rent !== null) {
							const publicationData = new PublicationData(publication);
							const rentData = new RentData(rent);
							const result = Object.assign(rentData, publicationData);
							return apiResponse.successResponseWithData(res, "Operation success", result);
						} else {
							return apiResponse.successResponseWithData(res, "Operation success", {});
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
 * Publication register.
 * 
 * @param {string} rent
 * @param {string} start_at
 * @param {string} end_at
 *
 * @returns {Object}
 */
exports.publicationRegister = [
	auth,
	check("rent", "Rent must not be empty.").isLength({ min: 1 }),
	check("start_at", "Start date must not be empty.").isLength({ min: 1 }).isISO8601().toDate(),
	check("end_at", "End date must not be empty.").isLength({ min: 1 }).isISO8601().toDate(),
	body("*").escape(),

	(req, res) => {
		try {
			const errors = validationResult(req);
			const publication = new Publication(
				{ 	rent: req.body.rent,
					start_at: req.body.start_at,
					end_at: req.body.end_at,
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				if(!mongoose.Types.ObjectId.isValid(req.body.rent)){
					return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid rent ID");
				} else {

					Rent.findById(req.body.rent, function (err, foundRent) {
						if (foundRent === null) {
							return apiResponse.notFoundResponse(res, "Rent not exists with this id");
						} else {
							//update rent.
							const update = {is_published: true};

							Rent.findByIdAndUpdate(req.body.rent, update, {}, function (err) {
								if (err) {
									return apiResponse.ErrorResponse(res, err);
								} else {
									//Save publication.
									publication.save(function (err) {
										if (err) {
											return apiResponse.ErrorResponse(res, err);
										}

										let publicationData = new PublicationData(publication);
										return apiResponse.successResponseWithData(res, "Publication register Success.", publicationData);
									});
								}
							});
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
 * Publication update.
 *
 * @param {string} rent
 * @param {string} start_at
 * @param {string} end_at
 * 
 * @returns {Object}
 */
exports.publicationUpdate = [
	auth,
	check("rent", "Rent must not be empty.").isLength({ min: 1 }),
	check("start_at", "Start date must not be empty.").isLength({ min: 1 }).isISO8601().toDate(),
	check("end_at", "End date must not be empty.").isLength({ min: 1 }).isISO8601().toDate(),
	body("*").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			const publication = new Publication(
				{ 	rent: req.body.rent,
					start_at: req.body.start_at,
					end_at: req.body.end_at,
					_id:req.params.id
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				if(!mongoose.Types.ObjectId.isValid(req.params.id)){
					return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
				}else{
					Publication.findById(req.params.id, function (err, foundPublication) {
						if(foundPublication === null){
							return apiResponse.notFoundResponse(res,"Publication not exists with this id");
						}else{
							if(!mongoose.Types.ObjectId.isValid(req.body.rent)){
								return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid rent ID");
							} else {
								Rent.findById(req.body.rent, function (err, foundRent) {
									if (foundRent === null) {
										return apiResponse.notFoundResponse(res, "Rent not exists with this id");
									} else {
										//Check authorized user
										if (foundRent.owner.toString() !== req.user._id) {
											return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
										} else {
											//update rent.
											Rent.findByIdAndUpdate(foundPublication.rent, {is_published: false}, {}, function (err) {
												if (err) {
													return apiResponse.ErrorResponse(res, err);
												} else {
													Rent.findByIdAndUpdate(req.body.rent, {is_published: true}, {}, function (err) {
														if (err) {
															return apiResponse.ErrorResponse(res, err);
														} else {
															//update publication.
															Publication.findByIdAndUpdate(req.params.id, publication, {}, function (err) {
																if (err) {
																	return apiResponse.ErrorResponse(res, err);
																} else {
																	let publicationData = new PublicationData(publication);
																	return apiResponse.successResponseWithData(res, "Publication update Success.", publicationData);
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
 * Publication Delete.
 * 
 * @param {string} id
 * 
 * @returns {Object}
 */
exports.publicationDelete = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
		}
		try {
			Publication.findById(req.params.id, function (err, foundPublication) {
				if(foundPublication === null){
					return apiResponse.notFoundResponse(res,"Publication not exists with this id");
				}else{
					Rent.findById(foundPublication.rent, function (err, foundRent) {
						if (foundRent === null) {
							return apiResponse.notFoundResponse(res, "Rent not exists with this id");
						} else {
							//Check authorized user
							if (foundRent.owner.toString() !== req.user._id) {
								return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
							} else {
								//delete publication.
								Publication.findByIdAndRemove(req.params.id, function (err) {
									if (err) {
										return apiResponse.ErrorResponse(res, err);
									} else {
										return apiResponse.successResponse(res, "Publication delete Success.");
									}
								});
							}
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