const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile_picture: { type: String, required: false }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = model('User', userSchema);