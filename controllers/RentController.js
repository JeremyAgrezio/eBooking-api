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
	this.is_rented = data.is_rented;
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
			Rent.find({owner: req.user._id},"_id title description capacity price pictures is_rented is_published")
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
			Rent.findOne({_id: req.params.id,owner: req.user._id},"_id title description capacity price area pictures " +
			"address city country postalCode is_published is_rented createdAt").then((rent)=>{
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
	check("title", "Title must not be empty.").isLength({ min: 1 }).trim(),
	check("description", "Description must not be empty.").isLength({ min: 1 }).trim(),
	check("capacity", "Capacity must not be empty.").isInt({ min: 1 }).trim(),
	check("price", "Price must not be empty.").isInt({ min: 1 }).trim(),
	check("area", "Area must not be empty.").isInt({ min: 1 }).trim(),
	check("pictures", "Pictures must not be empty.").trim(),
	check("address", "Address must not be empty.").isLength({ min: 1 }).trim(),
	check("city", "City must not be empty.").isLength({ min: 1 }).trim(),
	check("country", "Country must not be empty.").isLength({ min: 1 }).trim(),
	check("postalCode", "Postal code must not be empty.").isLength({ min: 1 }).trim(),
	body("*").escape(),
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
			else {
				if(req.params.associatedLock) {
					if(!mongoose.Types.ObjectId.isValid(req.params.associatedLock)){
						return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid Lock ID");
					}
				}
				else {
					//Save rent.
					rent.save(function (err) {
						if (err) {
							return apiResponse.ErrorResponse(res, err);
						}
						let rentData = new RentData(rent);
						return apiResponse.successResponseWithData(res, "Rent register Success.", rentData);
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
 * Rent update.
 *
 * @param {string} id
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
 * 
 * @returns {Object}
 */
exports.rentUpdate = [
	auth,
	check("title", "Title must not be empty.").isLength({ min: 1 }).trim(),
	check("description", "Description must not be empty.").isLength({ min: 1 }).trim(),
	check("capacity", "Capacity must not be empty.").isInt({ min: 1 }).trim(),
	check("price", "Price must not be empty.").isInt({ min: 1 }).trim(),
	check("area", "Area must not be empty.").isInt({ min: 1 }).trim(),
	check("pictures", "Pictures must not be empty.").isLength({ min: 1 }).trim(),
	check("address", "Address must not be empty.").isLength({ min: 1 }).trim(),
	check("city", "City must not be empty.").isLength({ min: 1 }).trim(),
	check("country", "Country must not be empty.").isLength({ min: 1 }).trim(),
	check("postalCode", "Postal code must not be empty.").isLength({ min: 1 }).trim(),
	body("*").escape(),
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
					_id:req.params.id
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				if(!mongoose.Types.ObjectId.isValid(req.params.id)){
					return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
				}else{
					if(req.body.associatedLock){
						if(!mongoose.Types.ObjectId.isValid(req.params.associatedLock)){
							return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid Lock ID");
						}
					}else {
						Rent.findById(req.params.id, function (err, foundRent) {
							if (foundRent === null) {
								return apiResponse.notFoundResponse(res, "Rent not exists with this id");
							} else {
								//Check authorized user
								if (foundRent.owner.toString() !== req.user._id) {
									return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
								} else {
									//update rent.
									Rent.findByIdAndUpdate(req.params.id, rent, {}, function (err) {
										if (err) {
											return apiResponse.ErrorResponse(res, err);
										} else {
											let rentData = new RentData(rent);
											return apiResponse.successResponseWithData(res, "Rent update Success.", rentData);
										}
									});
								}
							}
						});
					}
				}
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
					}else{
						//delete rent.
						Rent.findByIdAndRemove(req.params.id,function (err) {
							if (err) { 
								return apiResponse.ErrorResponse(res, err); 
							}else{
								return apiResponse.successResponse(res,"Rent delete Success.");
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