const mongoose = require("mongoose");
const Rent = mongoose.model('Rent')

const Schema = mongoose.Schema;

const PublicationSchema = new Schema({
    rent: {type: Schema.ObjectId, ref: 'Rent', required: true},
    start_at: {type: Date, required: true},
    end_at: {type: Date, required: true},
}, {timestamps: true});

PublicationSchema.statics.search = function (data, callback) {
    let query = this.find()

    Rent.find(data, function (error, rent) {
        query.where(
            {rent: rent}
        ).exec(callback);
    })
    return query
}

module.exports = mongoose.model("Publication", PublicationSchema);