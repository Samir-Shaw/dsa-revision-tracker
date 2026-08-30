const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/practiceController');

router.use(requireAuth);

router.get('/random', ctrl.randomPractice);
router.get('/history', ctrl.history);
router.post('/', ctrl.recordSession);

module.exports = router;
