const mongoose = require("mongoose");
const Publication = require("../models/PublicationModel");

const Schema = mongoose.Schema;

const ReservationSchema = new Schema({
    publication: {type: Schema.ObjectId, required: true, ref: 'Publication'},
    rent: {
        title: {type: String, required: true},
        price: {type: Number, required: true},
        fullPrice: {type: Number, required: true},
    },
    start_at: {type: Date, required: true},
    end_at: {type: Date, required: true},
    tenant: {type: Schema.ObjectId, ref: "User", required: true},
}, {timestamps: true});

module.exports = mongoose.model("Reservation", ReservationSchema);