const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PublicationSchema = new Schema({
    rent: {type: Schema.ObjectId, required: true},
    start_at: {type: Date, required: true},
    end_at: {type: Date, required: true},
}, {timestamps: true});

module.exports = mongoose.model("Publication", PublicationSchema);