const router = require('express').Router();
const historyController = require('../controllers/historyController');

router.get('/', historyController.getHistory);
router.post('/', historyController.createHistory);
router.delete('/:id', historyController.deleteHistoryItem);
router.delete('/', historyController.clearHistory);

module.exports = router;
