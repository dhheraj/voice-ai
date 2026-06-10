const TtsHistory = require('../models/TtsHistory');
const User = require('../models/User');

async function resolveUser(firebaseUid) {
  if (!firebaseUid) return null;
  return await User.findOne({ firebaseUid });
}

async function getHistory(req, res, next) {
  try {
    const { firebaseUid } = req.query;
    const user = await resolveUser(firebaseUid);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const items = await TtsHistory.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function createHistory(req, res, next) {
  try {
    const { firebaseUid, text, voice, locale, localeLabel, speaker, emotion, audioSize, durationMs, cached } = req.body;
    if (!text || !voice) return res.status(400).json({ message: 'text and voice required' });

    let user = await resolveUser(firebaseUid);
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign in again.' });
    }

    const entry = await TtsHistory.create({
      user: user._id,
      text,
      textPreview: text.slice(0, 200),
      voice,
      locale,
      localeLabel,
      speaker,
      emotion: emotion || '',
      audioSize: audioSize || 0,
      durationMs: durationMs || 0,
      cached: !!cached,
    });

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

async function deleteHistoryItem(req, res, next) {
  try {
    const { firebaseUid } = req.query;
    const user = await resolveUser(firebaseUid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const result = await TtsHistory.findOneAndDelete({ _id: req.params.id, user: user._id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function clearHistory(req, res, next) {
  try {
    const { firebaseUid } = req.query;
    const user = await resolveUser(firebaseUid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const result = await TtsHistory.deleteMany({ user: user._id });
    res.json({ ok: true, deleted: result.deletedCount });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHistory,
  createHistory,
  deleteHistoryItem,
  clearHistory
};
