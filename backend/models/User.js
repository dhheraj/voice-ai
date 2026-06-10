const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  photoURL: { type: String, default: '' },
  firebaseUid: { type: String, unique: true, sparse: true },
  authProvider: { type: String, enum: ['google', 'apple', 'email'], default: 'google' },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  lastLoginAt: { type: Date, default: Date.now },
  firebaseData: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
