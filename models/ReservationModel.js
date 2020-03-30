const mongoose = require("mongoose");
const Publication = require("../models/PublicationModel");

const Schema = mongoose.Schema;

const ReservationSchema = new Schema({
    publication: {type: Schema.ObjectId, required: true, ref: 'Publication'},
    tenant: {type: Schema.ObjectId, ref: "User", required: true},
}, {timestamps: true});

module.exports = mongoose.model("Reservation", ReservationSchema);