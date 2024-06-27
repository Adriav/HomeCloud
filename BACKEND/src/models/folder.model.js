const { Schema, model } = require('mongoose');

const folderSchema = new Schema({
    name: { type: String, required: true },
    owner: { type: String, required: true },
    parent: { type: String, required: true },
    public: { type: Boolean, required: true }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = model('Folder', folderSchema);

/*
    ID:
    Name: String
    Owner: 'userID'
    Padre: '' || 'folderID' (Otro folder ID)
    Hijo: '' || 'folderID'
*/