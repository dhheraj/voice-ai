const router = require('express').Router();
const authController = require('../controllers/authController');

router.post('/firebase-login', authController.firebaseLogin);
router.patch('/preferences', authController.updatePreferences);

module.exports = router;
