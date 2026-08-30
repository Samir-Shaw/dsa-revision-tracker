const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/importController');

router.use(requireAuth);

router.post('/parse', ctrl.parseImport);
router.post('/classify', ctrl.classifyImport);
router.post('/save', ctrl.saveImport);

module.exports = router;
