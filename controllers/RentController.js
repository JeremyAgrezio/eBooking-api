const Rent = require("../models/RentModel");
const { body, check, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

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
	this.publication_id = data.publication_id;
	this.reservations = data.reservations;
	this.associatedLock = data.associatedLock;
	this.createdAt = data.createdAt;
}

/**
 * Rent List.
 *
 * @returns {Object}
 */
exports.rentList = [
	auth,
	function (req, res) {
		try {
			Rent.find({owner: req.user._id},"_id title description capacity price pictures reservations is_published publication_id")
			.then((rents)=>{
				if(rents.length > 0){
					return apiResponse.successResponseWithData(res, "Operation success", rents);
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
 * Rent Detail.
 *
 * @param {string} id
 *
 * @returns {Object}
 */
exports.rentDetail = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.successResponseWithData(res, "Operation success", {});
		}
		try {
			Rent.findOne({_id: req.params.id,owner: req.user._id}).then((rent)=>{
				if(rent !== null){
					let rentData = new RentData(rent);
					return apiResponse.successResponseWithData(res, "Operation success", rentData);
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
 * Rent register.
 *
 * @param {string} title
 * @param {string} description
 * @param {number} capacity
 * @param {number} price
 * @param {number} area
 * @param {array} pictures
 * @param {string} address
 * @param {string} city
 * @param {string} country
 * @param {string} postalCode
 * @param {string} associatedLock
 *
 * @returns {Object}
 */
exports.rentRegister = [
	auth,
	check("title", "Title must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("description", "Description must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("capacity", "Capacity must not be empty.").isInt({ min: 1 }).trim().escape(),
	check("price", "Price must not be empty.").isInt({ min: 1 }).trim().escape(),
	check("area", "Area must not be empty.").isInt({ min: 1 }).trim().escape(),
	check("pictures"),
	check("address", "Address must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("city", "City must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("country", "Country must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("postalCode", "Postal code must not be empty.").isLength({ min: 1 }).trim().escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			const rent = new Rent(
				{ 	title: req.body.title,
					description: req.body.description,
					capacity: req.body.capacity,
					price: req.body.price,
					area: req.body.area,
					pictures: req.body.pictures,
					address: req.body.address,
					city: req.body.city,
					country: req.body.country,
					postalCode: req.body.postalCode,
					associatedLock: req.body.associatedLock || null,
					owner: req.user,
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else if (req.body.associatedLock) {
				if (!mongoose.Types.ObjectId.isValid(req.body.associatedLock)) {
					return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid Lock ID");
				}

				Rent.findOne({ associatedLock: req.body.associatedLock }, function (err, foundRent) {
					if(foundRent) return apiResponse.unauthorizedResponse(res, "Lock already registered.");
				});
			}
			else {
				if(req.body.pictures.length < 1){
					return apiResponse.requiredNotFound(res, "Pictures required");
				}
				//Save rent.
				rent.save(function (err) {
					if (err) {
						return apiResponse.ErrorResponse(res, err);
					}
					let rentData = new RentData(rent);
					return apiResponse.successResponseWithData(res, "Rent register Success.", rentData);
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Rent update.
 *
 * @param {string} id
 * @param {string} title
 * @param {string} description
 * @param {number} capacity
 * @param {number} price
 * @param {number} area
 * @param {array}  pictures
 * @param {string} address
 * @param {string} city
 * @param {string} country
 * @param {string} postalCode
 * @param {string} associatedLock
 *
 * @returns {Object}
 */
exports.rentUpdate = [
	auth,
	check("title", "Title must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("description", "Description must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("capacity", "Capacity must not be empty.").isInt({ min: 1 }).trim().escape(),
	check("price", "Price must not be empty.").isInt({ min: 1 }).trim().escape(),
	check("area", "Area must not be empty.").isInt({ min: 1 }).trim().escape(),
	check("pictures"),
	check("address", "Address must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("city", "City must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("country", "Country must not be empty.").isLength({ min: 1 }).trim().escape(),
	check("postalCode", "Postal code must not be empty.").isLength({ min: 1 }).trim().escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			const rent = new Rent(
				{ 	title: req.body.title,
					description: req.body.description,
					capacity: req.body.capacity,
					price: req.body.price,
					area: req.body.area,
					pictures: req.body.pictures,
					address: req.body.address,
					city: req.body.city,
					country: req.body.country,
					postalCode: req.body.postalCode,
					associatedLock: req.body.associatedLock ? req.body.associatedLock : null,
					_id:req.params.id
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				if(!mongoose.Types.ObjectId.isValid(req.params.id)){
					return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
				}

				Rent.findById(req.params.id, function (err, foundRent) {
					if (foundRent === null)
					{
						return apiResponse.notFoundResponse(res, "Rent not exists with this id");
					}
					else if (foundRent.owner.toString() !== req.user._id)
					{ //Check authorized user
						return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
					}
					else if (req.body.associatedLock)
					{
						if (!mongoose.Types.ObjectId.isValid(req.body.associatedLock)) {
							return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid Lock ID");
						}

						Rent.findOne({ associatedLock: req.body.associatedLock }, function (err, foundRent) {
							if (foundRent) return apiResponse.unauthorizedResponse(res, "Lock already registered.");
						});
					}
					else if (req.body.pictures.length < 1)
					{
						return apiResponse.requiredNotFound(res, "Pictures required");
					}

					//update rent.
					Rent.findByIdAndUpdate(req.params.id, rent, {}, function (err) {
						if (err)
						{
							return apiResponse.ErrorResponse(res, err);
						}
						else
						{
							let rentData = new RentData(rent);
							return apiResponse.successResponseWithData(res, "Rent update Success.", rentData);
						}
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
 * Rent Delete.
 *
 * @param {string} id
 *
 * @returns {Object}
 */
exports.rentDelete = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
		}
		try {
			Rent.findById(req.params.id, function (err, foundRent) {
				if(foundRent === null){
					return apiResponse.notFoundResponse(res,"Rent not exists with this id");
				}else{
					//Check authorized user
					if(foundRent.owner.toString() !== req.user._id){
						return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
					}

					Rent.findByIdAndRemove(req.params.id,function (err) { //delete rent.
						if (err) {
							return apiResponse.ErrorResponse(res, err);
						}

						return apiResponse.successResponse(res,"Rent delete Success.");
					});
				}
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];
