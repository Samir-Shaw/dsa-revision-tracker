const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const Problem = require('../models/Problem');
const { AppError } = require('../middleware/errorHandler');

const VALID_RESULTS = ['Remembered', 'Partially Remembered', 'Forgot', 'Solved', 'Not Solved', 'Skipped'];

/** Random practice: number, difficulty, pattern, source — all scoped to req.userId. */
async function randomPractice(req, res, next) {
  try {
    const { count = 10, difficulty = 'All', pattern = 'All', source = 'All Problems' } = req.query;

    let sourceFilter = {};
    if (source === 'Due for Revision') sourceFilter = { bucket: 'due' };
    else if (source === 'Never Revised') sourceFilter = { bucket: 'never' };

    let pool_;
    if (source === 'Due for Revision' || source === 'Never Revised') {
      pool_ = await Problem.dueForRevision(req.userId, sourceFilter);
    } else {
      const favoritesOnly = source === 'Favorites';
      const { problems } = await Problem.list(req.userId, {
        difficulty, pattern, favoritesOnly, pageSize: 1000,
      });
      pool_ = problems;
    }

    if (difficulty !== 'All') pool_ = pool_.filter((p) => p.difficulty === difficulty);
    if (pattern !== 'All') pool_ = pool_.filter((p) => p.primary_pattern === pattern || p.secondary_patterns?.includes(pattern));

    // Fisher-Yates shuffle, then take N.
    for (let i = pool_.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool_[i], pool_[j]] = [pool_[j], pool_[i]];
    }

    res.json({ problems: pool_.slice(0, Math.min(parseInt(count, 10) || 10, pool_.length)) });
  } catch (err) {
    next(err);
  }
}

async function recordSession(req, res, next) {
  try {
    const { problem_id, result, time_taken, notes } = req.body;
    if (!VALID_RESULTS.includes(result)) throw new AppError('Invalid result value');

    const problem = await Problem.findById(req.userId, problem_id);
    if (!problem) throw new AppError('Problem not found', 404);

    await pool.query(
      `INSERT INTO practice_sessions (id, user_id, problem_id, result, time_taken, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.userId, problem_id, result, time_taken || null, notes || null]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT ps.*, p.title, p.leetcode_number, p.primary_pattern FROM practice_sessions ps
       JOIN problems p ON p.id = ps.problem_id
       WHERE ps.user_id = ? ORDER BY ps.practice_date DESC LIMIT 200`,
      [req.userId]
    );
    res.json({ sessions: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { randomPractice, recordSession, history };
