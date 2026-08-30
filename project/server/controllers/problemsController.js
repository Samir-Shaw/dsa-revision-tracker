const Problem = require('../models/Problem');
const { AppError } = require('../middleware/errorHandler');

const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

async function listProblems(req, res, next) {
  try {
    const result = await Problem.list(req.userId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getProblem(req, res, next) {
  try {
    const problem = await Problem.findById(req.userId, req.params.id);
    if (!problem) throw new AppError('Problem not found', 404);
    res.json({ problem });
  } catch (err) {
    next(err);
  }
}

async function createProblem(req, res, next) {
  try {
    const { leetcode_number, title, difficulty, primary_pattern } = req.body;

    if (!leetcode_number || isNaN(Number(leetcode_number))) {
      throw new AppError('LeetCode number must be numeric');
    }
    if (!title || !title.trim()) throw new AppError('Title is required');
    if (!VALID_DIFFICULTIES.includes(difficulty)) throw new AppError('Difficulty must be Easy, Medium, or Hard');
    if (!primary_pattern) throw new AppError('Primary pattern is required (use Auto Categorize if unsure)');

    const dup = await Problem.findByLeetcodeNumber(req.userId, Number(leetcode_number));
    if (dup) throw new AppError(`You already have problem #${leetcode_number} in your list`, 409);

    const problem = await Problem.create(req.userId, { ...req.body, leetcode_number: Number(leetcode_number) });
    res.status(201).json({ problem });
  } catch (err) {
    next(err);
  }
}

async function updateProblem(req, res, next) {
  try {
    if (req.body.difficulty && !VALID_DIFFICULTIES.includes(req.body.difficulty)) {
      throw new AppError('Difficulty must be Easy, Medium, or Hard');
    }
    const problem = await Problem.update(req.userId, req.params.id, req.body);
    if (!problem) throw new AppError('Problem not found', 404);
    res.json({ problem });
  } catch (err) {
    next(err);
  }
}

async function deleteProblem(req, res, next) {
  try {
    const ok = await Problem.delete(req.userId, req.params.id);
    if (!ok) throw new AppError('Problem not found', 404);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    const data = await Problem.stats(req.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listProblems, getProblem, createProblem, updateProblem, deleteProblem, stats };
