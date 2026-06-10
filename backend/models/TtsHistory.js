const mongoose = require('mongoose');

const ttsHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true },
  textPreview: { type: String, default: '' },
  voice: { type: String, required: true },
  locale: { type: String, required: true },
  localeLabel: { type: String, default: '' },
  speaker: { type: String, required: true },
  emotion: { type: String, default: '' },
  audioSize: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  cached: { type: Boolean, default: false },
}, { timestamps: true });

ttsHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('TtsHistory', ttsHistorySchema);
