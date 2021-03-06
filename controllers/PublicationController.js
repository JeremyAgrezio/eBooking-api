const Publication = require("../models/PublicationModel");
const Rent = require("../models/RentModel");
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

/**
 * Publication List.
 *
 * @returns {Object}
 */
exports.publicationList = [
	auth,
	function (req, res) {
		try {
			if(Object.keys(req.query).length !== 0) {
				Publication.search(req.query, function (err, publications) {
					if(err) res.send(err);

					else {
						if(publications.length > 0){
							return apiResponse.successResponseWithData(res, "Operation success", publications);
						}

						return apiResponse.successResponseWithData(res, "Operation success", []);
					}
				});
			} else {
				Publication.find({}, {'_id': 1, 'start_at': 1, 'end_at':1} )
				.populate('rent', {'_id': 0, 'pictures': 1, 'title': 1, 'city': 1, 'capacity': 1, 'price': 1, 'area': 1})
				.then((publications)=>{
					if(publications.length > 0){
						return apiResponse.successResponseWithData(res, "Operation success", publications);
					}else{
						return apiResponse.successResponseWithData(res, "Operation success", []);
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
 * Publication Detail.
 *
 * @param {string} id
 *
 * @returns {Object}
 */
exports.publicationDetail = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.successResponseWithData(res, "Operation success", {});
		}
		try {
			Publication.findOne({_id: req.params.id},"_id start_at end_at")
			.populate('rent', {'_id': 0, 'is_published': 0, 'owner': 0, 'updatedAt': 0, 'createdAt': 0, '__v': 0})
			.then((publication)=>{
				if(publication !== null){
					return apiResponse.successResponseWithData(res, "Operation success", publication);
				}

				return apiResponse.successResponseWithData(res, "Operation success", {});
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
			const publication_start = new Date(req.body.start_at)
			const publication_end = new Date(req.body.end_at)
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
				}
				Rent.findById(req.body.rent, function (err, rent) {
					if (err) {
						return apiResponse.ErrorResponse(res, err);
					}
					else if (publication_start >= publication_end){
						return apiResponse.unauthorizedResponse(res, "End date must be superior to start date");
					}
					else if (!rent.associatedLock) {
						return apiResponse.ErrorResponse(res, "Rent doesn't have an associated lock");
					}

					//Save publication.
					publication.save(function (err) {
						if (err) return apiResponse.ErrorResponse(res, err);

						const publicationData = new PublicationData(publication);
						Rent.findByIdAndUpdate(req.body.rent, {is_published: true, publication_id: publicationData.id}, {}, function (err) {
							if (err) return apiResponse.ErrorResponse(res, err);

							return apiResponse.successResponseWithData(res, "Publication register Success.", publicationData);
						});
					});
				});
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
			const publication_start = new Date(req.body.start_at)
			const publication_end = new Date(req.body.end_at)
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
				}
				Publication.findById(req.params.id, function (err, foundPublication) {
					if(foundPublication === null){
						return apiResponse.notFoundResponse(res,"Publication not exists with this id");
					}
					else if(!mongoose.Types.ObjectId.isValid(req.body.rent)){
						return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid rent ID");
					}
					Rent.findById(req.body.rent, function (err, foundRent) {
						if (foundRent === null) {
							return apiResponse.notFoundResponse(res, "Rent not exists with this id");
						}
						else if (foundRent.owner.toString() !== req.user._id) { //Check authorized user
							return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
						}
						else if (publication_start >= publication_end){
							return apiResponse.unauthorizedResponse(res, "End date must be superior to start date");
						}
						else if (!foundRent.associatedLock) {
							return apiResponse.ErrorResponse(res, "Rent doesn't have an associated lock");
						}

						//Update publication.
						Publication.findByIdAndUpdate(req.params.id, publication, {}, function (err) {
							if (err) return apiResponse.ErrorResponse(res, err);

							const publicationData = new PublicationData(publication);
							return apiResponse.successResponseWithData(res, "Publication update Success.", publicationData);
						})
					});
				});
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
			Publication.findById(req.params.id)
			.populate('rent')
			.then((foundPublication)=>{
				if(foundPublication === null){
					return apiResponse.notFoundResponse(res, "Publication not exists with this id");
				}
				else if (foundPublication.rent.owner.toString() !== req.user._id) {
					return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
				}

				Publication.findByIdAndRemove(req.params.id, function (err) { //delete publication.
					if (err) return apiResponse.ErrorResponse(res, err);

					Rent.findByIdAndUpdate(foundPublication.rent, { is_published: false, publication_id: null }, {}, function (err) {
						if (err) return apiResponse.ErrorResponse(res, err);

						return apiResponse.successResponse(res, "Publication delete Success.");
					})
				});
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];
