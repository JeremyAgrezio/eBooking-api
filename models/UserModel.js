const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	address: {type: String, required: false},
	city: {type: String, required: false},
	country: {type: String, required: false},
	postalCode: {type: String, required: false},
	phone: {type: String, required: false},
	email: {type: String, required: true},
	password: {type: String, required: true},
	picture: {type: String, required: false},
	isConfirmed: {type: Boolean, required: true, default: 0},
	confirmOTP: {type: String, required: false},
	otpTries: {type: Number, required: false, default: 0},
	status: {type: Boolean, required: true, default: 1},
	role: {type: String, required: true, default: 'USER'}
}, {timestamps: true});

// Virtual for user's full name
UserSchema
	.virtual("fullName")
	.get(function () {
		return this.firstName + " " + this.lastName;
	});

module.exports = mongoose.model("User", UserSchema);