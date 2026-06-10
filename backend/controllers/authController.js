const User = require('../models/User');

async function firebaseLogin(req, res, next) {
  try {
    const { rawUserData } = req.body;
    if (!rawUserData?.uid || !rawUserData?.email) {
      return res.status(400).json({ message: 'Missing Firebase user data' });
    }

    const { uid, email, displayName, photoURL } = rawUserData;

    let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }] });

    if (!user) {
      user = new User({
        name: displayName || email.split('@')[0],
        email: email.toLowerCase(),
        photoURL: photoURL || '',
        firebaseUid: uid,
        authProvider: 'google',
        lastLoginAt: new Date(),
        firebaseData: rawUserData,
      });
    } else {
      let changed = false;
      if (!user.firebaseUid) { user.firebaseUid = uid; changed = true; }
      if (photoURL && user.photoURL !== photoURL) { user.photoURL = photoURL; changed = true; }
      if (displayName && user.name !== displayName) { user.name = displayName; changed = true; }
      user.lastLoginAt = new Date();
      changed = true;
      if (changed) await user.save();
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        uid: user.firebaseUid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        theme: user.theme,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updatePreferences(req, res, next) {
  try {
    const { firebaseUid, theme } = req.body;
    if (!firebaseUid) return res.status(400).json({ message: 'firebaseUid required' });
    
    const updates = {};
    if (theme && ['light', 'dark'].includes(theme)) updates.theme = theme;
    
    const user = await User.findOneAndUpdate({ firebaseUid }, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ theme: user.theme });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  firebaseLogin,
  updatePreferences
};
