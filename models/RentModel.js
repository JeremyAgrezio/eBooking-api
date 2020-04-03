const mongoose = require("mongoose");
const Lock = require("../models/LockModel");

const Schema = mongoose.Schema;

const RentSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    capacity: {type: Number, required: true},
    price: {type: Number, required: true},
    area: {type: Number, required: true},
    pictures: {type: Array, required: true},
    address: {type: String, required: true},
    city: {type: String, required: true},
    country: {type: String, required: true},
    postalCode: {type: String, required: true},
    is_published: {type: Boolean, required: true, default: 0},
    is_rented: {type: Boolean, required: true, default: 0},
    associatedLock: {type: Schema.ObjectId, ref: "Lock"},
    owner: {type: Schema.ObjectId, ref: "User", required: true},
}, {timestamps: true});

module.exports = mongoose.model("Rent", RentSchema);