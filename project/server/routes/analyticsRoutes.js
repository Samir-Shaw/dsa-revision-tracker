const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

router.get('/', requireAuth, getAnalytics);

module.exports = router;
