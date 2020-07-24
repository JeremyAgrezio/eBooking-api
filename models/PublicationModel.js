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
        query.where({rent: rent})
            .populate('rent', {'_id': 0, 'pictures': 1, 'title': 1, 'city': 1, 'capacity': 1, 'price': 1, 'area': 1})
            .exec(callback);
    })
    return query
}

module.exports = mongoose.model("Publication", PublicationSchema);