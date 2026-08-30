const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/revisionsController');

router.use(requireAuth);

router.get('/', ctrl.listHistory);
router.get('/due', ctrl.listDue);
router.post('/', ctrl.recordRevision);

module.exports = router;
