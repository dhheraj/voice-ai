const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Session' },
  isPinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

conversationSchema.index({ user: 1, isDeleted: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
