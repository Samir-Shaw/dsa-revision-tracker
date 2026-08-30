const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/profileController');

router.use(requireAuth);

router.get('/', ctrl.getProfile);
router.put('/', ctrl.updateProfile);
router.put('/settings', ctrl.updateSettings);
router.get('/export', ctrl.exportData);

module.exports = router;
