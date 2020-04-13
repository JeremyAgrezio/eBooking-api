// const { storage } = require("../app");
const multer = require('multer');
const path = require("path");
const { body, check, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './uploads')
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname));
	}
})

const upload = multer(
	{
		storage: storage,
		fileFilter: function (req, file, callback) {
			const ext = path.extname(file.originalname);
			if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
				return callback(new Error('Only images are allowed'))
			}
			callback(null, true)
		}
	});

/**
 * Upload one file
 * 
 * @returns {Object}
 */
exports.uploadFile = [
	auth,
	upload.single('singleFile'),
	function (req, res) {
		try {
			const file = req.file
			if (!file) {
				const err = new Error('Please upload a file')
				err.httpStatusCode = 400
				return apiResponse.ErrorResponse(res, err)
			}

			return apiResponse.successResponseWithData(res, 'Upload success !', file.path);
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Upload multiple files
 *
 * @returns {Object}
 */
exports.uploadFiles = [
	auth,
	upload.array('multipleFiles', 5),
	function (req, res) {
		try {
			const files = req.files

			if (!files) {
				const err = new Error('Please choose files')
				err.httpStatusCode = 400
				return apiResponse.ErrorResponse(res, err)
			}

			const filesPath = new Map();
			for (let i = 0, len = files.length; i < len; ++i) {
				filesPath.set(i, files[i].filename );
			}

			return apiResponse.successResponse(res, Array.from(filesPath.values()));
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];
