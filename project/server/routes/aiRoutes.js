const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const gemini = require('../services/geminiService');

router.use(requireAuth);

// Single-problem classification, used by "Auto Categorize" in Add Problem form.
router.post('/classify', async (req, res, next) => {
  try {
    const { leetcode_number, title, difficulty } = req.body;
    if (!title) throw new AppError('Title is required to classify a problem');
    const result = await gemini.classifyProblem({ leetcode_number, title, difficulty });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
