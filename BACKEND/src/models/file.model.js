const { Schema, model } = require('mongoose');

const fileSchema = new Schema({
    owner: { type: String, required: true },
    file_name: { type: String, required: true },
    extension_type: { type: String, required: true },
    size: { type: String, required: true },
    folder: { type: String, required: true },
    public: { type: Boolean, required: true }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = model('File', fileSchema);

/*
    ID:
    
    Owner: 'userID'
    folder: 'folderID'
    file_name: String
    creation: Date
    extension_type: '.*'
*/