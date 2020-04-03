const Lock = require("../models/LockModel");
const { body, check, validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
// const utility = require("../helpers/utility");
const auth = require("../middlewares/jwt");
// const bcrypt = require("bcrypt");
// const mailer = require("../helpers/mailer");
// const { constants } = require("../helpers/constants");
const mongoose = require("mongoose");
const WebSocket = require('ws');

// lock Schema
function LockData(data) {
	this.id = data._id;
	this.name = data.name;
	this.address = data.address;
	this.auth = data.auth;
	this.owner = data.owner;
}

/**
 * Lock List.
 *
 * @returns {Object}
 */
exports.lockList = [
	auth,
	function (req, res) {
		try {
			Lock.find({owner: req.user._id},{"name": 1, "address": 1})
				.then((locks)=>{
					if(locks.length > 0){
						return apiResponse.successResponseWithData(res, "Operation success", locks);
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
 * Lock Detail.
 *
 * @param {string} id
 *
 * @returns {Object}
 */
exports.lockDetail = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.successResponseWithData(res, "Operation success", {});
		}
		try {
			Lock.findOne({_id: req.params.id,owner: req.user._id}).then((lock)=>{
				if(lock !== null){
					let lockData = new LockData(lock);
					return apiResponse.successResponseWithData(res, "Operation success", lockData);
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
 * Lock register.
 *
 * @param {string} name
 * @param {string} address
 * @param {string} auth
 *
 * @returns {Object}
 */
exports.lockRegister = [
	auth,
	check("name", "Lock name must not be empty.").isLength({ min: 1 }).trim(),
	check("address", "Lock network address must not be empty.").isLength({ min: 1 }).trim(),
	check("auth", "Lock authentication must not be empty.").isLength({ min: 1 }).trim(),
	body("*").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			const lock = new Lock(
				{ 	name: req.body.name,
					address: req.body.address,
					auth: req.body.auth,
					owner: req.user,
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				//Save lock.
				lock.save(function (err) {
					if (err) { return apiResponse.ErrorResponse(res, err); }
					let lockData = new LockData(lock);
					return apiResponse.successResponseWithData(res,"Lock register Success.", lockData);
				});
			}
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Lock update.
 *
 * @param {string} id
 * @param {string} name
 * @param {string} address
 * @param {string} auth
 *
 * @returns {Object}
 */
exports.lockUpdate = [
	auth,
	check("name", "Lock name must not be empty.").isLength({ min: 1 }).trim(),
	check("address", "Lock network address must not be empty.").isLength({ min: 1 }).trim(),
	check("auth", "Lock authentication must not be empty.").isLength({ min: 1 }).trim(),
	body("*").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			const lock = new Lock(
				{ 	name: req.body.name,
					address: req.body.address,
					auth: req.body.auth,
					owner: req.user,
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				if(!mongoose.Types.ObjectId.isValid(req.params.id)){
					return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
				}else{
					Lock.findById(req.params.id, function (err, foundLock) {
						if(foundLock === null){
							return apiResponse.notFoundResponse(res,"Lock not exists with this id");
						}else{
							//Check authorized user
							if(foundLock.owner.toString() !== req.user._id){
								return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
							}else{
								//update lock.
								Lock.findByIdAndUpdate(req.params.id, lock, {},function (err) {
									if (err) {
										return apiResponse.ErrorResponse(res, err);
									}else{
										let lockData = new LockData(lock);
										return apiResponse.successResponseWithData(res,"Lock update Success.", lockData);
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
 * Lock Delete.
 *
 * @param {string} id
 *
 * @returns {Object}
 */
exports.lockDelete = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
		}
		try {
			Lock.findById(req.params.id, function (err, foundLock) {
				if(foundLock === null){
					return apiResponse.notFoundResponse(res,"Lock not exists with this id");
				}else{
					//Check authorized user
					if(foundLock.owner.toString() !== req.user._id){
						return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
					}else{
						//delete lock.
						Lock.findByIdAndRemove(req.params.id,function (err) {
							if (err) {
								return apiResponse.ErrorResponse(res, err);
							}else{
								return apiResponse.successResponse(res,"Lock delete Success.");
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

/**
 * Open lock.
 *
 * @returns {Object}
 */
exports.lockOpen = [
	auth,
	function (req, res) {
		const ws = new WebSocket('wss://' + process.env.DOOR_WEBSOCKET + '/ws');
		ws.onopen = function(evt) {
			console.log("WEBSOCKET STATUS: Connected");
			ws.send("on_g");
		};

		ws.onmessage = function(evt) {
			if(evt.data === "door_unlocked") return apiResponse.successResponseWithData(res, "Door Unlocked !");
			if(evt.data === "door_locked") return apiResponse.successResponseWithData(res, "Door Locked !");
		};

		ws.onclose = function(evt) {
			console.log("WEBSOCKET STATUS: Disconnected");
		};
	}
];