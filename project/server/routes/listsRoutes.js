const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/listsController');

router.use(requireAuth);

router.get('/', ctrl.listLists);
router.post('/', ctrl.createList);
router.put('/:id', ctrl.updateList);
router.delete('/:id', ctrl.deleteList);
router.post('/:id/problems', ctrl.addProblemToList);
router.delete('/:id/problems/:problemId', ctrl.removeProblemFromList);

module.exports = router;
