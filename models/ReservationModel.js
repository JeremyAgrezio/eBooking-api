const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ReservationSchema = new Schema({
    publication: {type: Schema.ObjectId, required: true},
    tenant: {type: Schema.ObjectId, ref: "User", required: true},
}, {timestamps: true});

module.exports = mongoose.model("Reservation", ReservationSchema);