const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/problemsController');

router.use(requireAuth);

router.get('/', ctrl.listProblems);
router.get('/stats', ctrl.stats);
router.get('/:id', ctrl.getProblem);
router.post('/', ctrl.createProblem);
router.put('/:id', ctrl.updateProblem);
router.delete('/:id', ctrl.deleteProblem);

module.exports = router;
