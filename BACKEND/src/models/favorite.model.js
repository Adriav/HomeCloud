const { Schema, model } = require('mongoose');

const favoriteSchema = new Schema({
    user: { type: String, required: true },
    folder: { type: String, required: true },
    folder_name: { type: String, required: true },
    public: { type: Boolean, required: true }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = model('Favorite', favoriteSchema);