const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const Problem = require('../models/Problem');
const { computeNextRevision } = require('../services/revisionService');
const { AppError } = require('../middleware/errorHandler');

const VALID_RESULTS = ['Remembered', 'Partially Remembered', 'Forgot'];

async function listDue(req, res, next) {
  try {
    const bucket = req.query.bucket || 'due';
    const problems = await Problem.dueForRevision(req.userId, { bucket });
    res.json({ problems });
  } catch (err) {
    next(err);
  }
}

async function listHistory(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, p.title, p.leetcode_number FROM revisions r
       JOIN problems p ON p.id = r.problem_id
       WHERE r.user_id = ? ORDER BY r.revision_date DESC LIMIT 100`,
      [req.userId]
    );
    res.json({ revisions: rows });
  } catch (err) {
    next(err);
  }
}

/** Records a revision event and never overwrites history — every attempt is a new row. */
async function recordRevision(req, res, next) {
  try {
    const { problem_id, result, notes } = req.body;
    if (!VALID_RESULTS.includes(result)) throw new AppError('result must be Remembered, Partially Remembered, or Forgot');

    const problem = await Problem.findById(req.userId, problem_id);
    if (!problem) throw new AppError('Problem not found', 404);

    const { newLevel, nextRevisionAt, newStatus } = computeNextRevision(problem.revision_level, result);

    const [[{ cnt }]] = await pool.query(
      'SELECT COUNT(*) as cnt FROM revisions WHERE problem_id = ?',
      [problem_id]
    );
    const revisionNumber = cnt + 1;

    await pool.query(
      `INSERT INTO revisions (id, user_id, problem_id, revision_number, result, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.userId, problem_id, revisionNumber, result, notes || null]
    );

    const updated = await Problem.update(req.userId, problem_id, {
      revision_level: newLevel,
      last_revised_at: new Date(),
      next_revision_at: nextRevisionAt,
      status: newStatus,
    });

    res.json({ problem: updated, revisionNumber });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDue, listHistory, recordRevision };
