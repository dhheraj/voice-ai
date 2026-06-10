const router = require('express').Router();
const ttsController = require('../controllers/ttsController');

router.get('/voices', ttsController.getVoices);
router.get('/cache-stats', ttsController.getCacheStats);
router.post('/', ttsController.synthesize);

module.exports = router;
