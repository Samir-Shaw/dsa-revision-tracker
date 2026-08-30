const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

async function listLists(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, COUNT(clp.id) as problem_count FROM custom_lists l
       LEFT JOIN custom_list_problems clp ON clp.list_id = l.id
       WHERE l.user_id = ? GROUP BY l.id ORDER BY l.created_at DESC`,
      [req.userId]
    );
    res.json({ lists: rows });
  } catch (err) {
    next(err);
  }
}

async function createList(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) throw new AppError('List name is required');

    const id = uuidv4();
    await pool.query('INSERT INTO custom_lists (id, user_id, name, description) VALUES (?, ?, ?, ?)', [
      id, req.userId, name.trim(), description || null,
    ]);
    res.status(201).json({ id, name, description });
  } catch (err) {
    next(err);
  }
}

async function updateList(req, res, next) {
  try {
    const { name, description } = req.body;
    const [result] = await pool.query(
      'UPDATE custom_lists SET name = ?, description = ? WHERE id = ? AND user_id = ?',
      [name, description, req.params.id, req.userId]
    );
    if (result.affectedRows === 0) throw new AppError('List not found', 404);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteList(req, res, next) {
  try {
    const [result] = await pool.query('DELETE FROM custom_lists WHERE id = ? AND user_id = ?', [
      req.params.id, req.userId,
    ]);
    if (result.affectedRows === 0) throw new AppError('List not found', 404);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** Verifies both the list and the problem belong to this user before linking. */
async function addProblemToList(req, res, next) {
  try {
    const { problemId } = req.body;
    const [[list]] = await pool.query('SELECT id FROM custom_lists WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!list) throw new AppError('List not found', 404);
    const [[problem]] = await pool.query('SELECT id FROM problems WHERE id = ? AND user_id = ?', [problemId, req.userId]);
    if (!problem) throw new AppError('Problem not found', 404);

    await pool.query(
      'INSERT IGNORE INTO custom_list_problems (id, list_id, problem_id) VALUES (?, ?, ?)',
      [uuidv4(), req.params.id, problemId]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function removeProblemFromList(req, res, next) {
  try {
    const [[list]] = await pool.query('SELECT id FROM custom_lists WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!list) throw new AppError('List not found', 404);

    await pool.query('DELETE FROM custom_list_problems WHERE list_id = ? AND problem_id = ?', [
      req.params.id, req.params.problemId,
    ]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listLists, createList, updateList, deleteList, addProblemToList, removeProblemFromList };
