const { pool } = require('../config/db');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    const [[settings]] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [req.userId]);
    res.json({ user, settings });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, avatarUrl } = req.body;
    if (!name || !name.trim()) throw new AppError('Name is required');
    const user = await User.updateProfile(req.userId, { name: name.trim(), avatarUrl: avatarUrl || null });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { theme, revisionSchedule, defaultPracticeCount } = req.body;
    if (theme && !['dark', 'light', 'system'].includes(theme)) throw new AppError('Invalid theme');

    await pool.query(
      `UPDATE user_settings SET
         theme = COALESCE(?, theme),
         revision_schedule = COALESCE(?, revision_schedule),
         default_practice_count = COALESCE(?, default_practice_count)
       WHERE user_id = ?`,
      [theme || null, revisionSchedule ? JSON.stringify(revisionSchedule) : null, defaultPracticeCount || null, req.userId]
    );
    const [[settings]] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [req.userId]);
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

/** Exports only the authenticated user's own data — never another user's. */
async function exportData(req, res, next) {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const [problems] = await pool.query('SELECT * FROM problems WHERE user_id = ?', [req.userId]);
    const [revisions] = await pool.query('SELECT * FROM revisions WHERE user_id = ?', [req.userId]);
    const [practice] = await pool.query('SELECT * FROM practice_sessions WHERE user_id = ?', [req.userId]);

    if (format === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename="dsa-export.json"');
      return res.json({ problems, revisions, practiceSessions: practice });
    }

    // CSV: problems only (revisions/practice are secondary detail, still available via JSON export).
    const header = 'leetcode_number,title,difficulty,primary_pattern,status,date_solved,is_favorite,notes\n';
    const rows = problems
      .map((p) =>
        [p.leetcode_number, `"${p.title.replace(/"/g, '""')}"`, p.difficulty, p.primary_pattern, p.status, p.date_solved || '', p.is_favorite, `"${(p.notes || '').replace(/"/g, '""')}"`].join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="dsa-export.csv"');
    res.send(header + rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, updateSettings, exportData };
