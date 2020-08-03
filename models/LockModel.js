const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LockSchema = new mongoose.Schema({
	name: {type: String, required: true},
	serial:{type: String, required: true},
	owner: {type: Schema.ObjectId, ref: "User", required: true},
}, {timestamps: true});

module.exports = mongoose.model("Lock", LockSchema);