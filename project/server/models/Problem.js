const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

function rowToProblem(row) {
  if (!row) return null;
  return {
    ...row,
    secondary_patterns:
      typeof row.secondary_patterns === 'string'
        ? JSON.parse(row.secondary_patterns)
        : row.secondary_patterns || [],
    is_favorite: !!row.is_favorite,
  };
}

const Problem = {
  /**
   * List problems for a user with optional filters/sort/pagination.
   * `userId` must come from req.userId (the JWT), never from client params.
   */
  async list(userId, { search, difficulty, pattern, status, favoritesOnly, sortBy, sortDir, page = 1, pageSize = 50 } = {}) {
    const where = ['user_id = ?'];
    const params = [userId];

    if (search) {
      where.push(
        '(title LIKE ? OR CAST(leetcode_number AS CHAR) LIKE ? OR primary_pattern LIKE ? OR JSON_SEARCH(secondary_patterns, "one", ?) IS NOT NULL OR notes LIKE ?)'
      );
      const like = `%${search}%`;
      params.push(like, like, like, `%${search}%`, like);
    }
    if (difficulty && difficulty !== 'All') {
      where.push('difficulty = ?');
      params.push(difficulty);
    }
    if (pattern && pattern !== 'All') {
      where.push('(primary_pattern = ? OR JSON_SEARCH(secondary_patterns, "one", ?) IS NOT NULL)');
      params.push(pattern, pattern);
    }
    if (status && status !== 'All') {
      where.push('status = ?');
      params.push(status);
    }
    if (favoritesOnly) {
      where.push('is_favorite = 1');
    }

    const allowedSort = {
      leetcode_number: 'leetcode_number',
      title: 'title',
      difficulty: 'difficulty',
      date_solved: 'date_solved',
      last_revised_at: 'last_revised_at',
      next_revision_at: 'next_revision_at',
      revision_level: 'revision_level',
    };
    const orderCol = allowedSort[sortBy] || 'leetcode_number';
    const orderDir = sortDir === 'desc' ? 'DESC' : 'ASC';

    const limit = Math.min(parseInt(pageSize, 10) || 50, 200);
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

    const whereSql = where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT * FROM problems WHERE ${whereSql} ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM problems WHERE ${whereSql}`, params);

    return { problems: rows.map(rowToProblem), total, page: Number(page), pageSize: limit };
  },

  async findById(userId, id) {
    const [rows] = await pool.query('SELECT * FROM problems WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
    return rowToProblem(rows[0]);
  },

  async findByLeetcodeNumber(userId, leetcodeNumber) {
    const [rows] = await pool.query(
      'SELECT * FROM problems WHERE user_id = ? AND leetcode_number = ? LIMIT 1',
      [userId, leetcodeNumber]
    );
    return rowToProblem(rows[0]);
  },

  async create(userId, data) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO problems
       (id, user_id, leetcode_number, title, difficulty, primary_pattern, secondary_patterns,
        status, date_solved, leetcode_url, notes, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.leetcode_number,
        data.title,
        data.difficulty,
        data.primary_pattern,
        JSON.stringify(data.secondary_patterns || []),
        data.status || 'Solved',
        data.date_solved || null,
        data.leetcode_url || null,
        data.notes || null,
        data.is_favorite ? 1 : 0,
      ]
    );
    return this.findById(userId, id);
  },

  /** Verifies ownership before updating — never trust that the id belongs to this user. */
  async update(userId, id, data) {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    const fields = [];
    const params = [];
    const updatable = [
      'title', 'difficulty', 'primary_pattern', 'status', 'date_solved',
      'leetcode_url', 'notes', 'is_favorite', 'revision_level',
      'last_revised_at', 'next_revision_at',
    ];
    for (const key of updatable) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'is_favorite' ? (data[key] ? 1 : 0) : data[key]);
      }
    }
    if (data.secondary_patterns !== undefined) {
      fields.push('secondary_patterns = ?');
      params.push(JSON.stringify(data.secondary_patterns));
    }
    if (fields.length === 0) return existing;

    params.push(id, userId);
    await pool.query(`UPDATE problems SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, params);
    return this.findById(userId, id);
  },

  async delete(userId, id) {
    const [result] = await pool.query('DELETE FROM problems WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  },

  async dueForRevision(userId, { bucket = 'due' } = {}) {
    // bucket: 'due' (today+overdue), 'overdue', 'upcoming', 'mastered', 'never'
    let clause = '';
    if (bucket === 'due') clause = 'next_revision_at IS NOT NULL AND next_revision_at <= NOW()';
    else if (bucket === 'overdue') clause = 'next_revision_at IS NOT NULL AND next_revision_at < CURDATE()';
    else if (bucket === 'upcoming') clause = 'next_revision_at IS NOT NULL AND next_revision_at > NOW()';
    else if (bucket === 'mastered') clause = "status = 'Mastered'";
    else if (bucket === 'never') clause = 'last_revised_at IS NULL';

    const [rows] = await pool.query(
      `SELECT * FROM problems WHERE user_id = ? AND ${clause} ORDER BY next_revision_at ASC`,
      [userId]
    );
    return rows.map(rowToProblem);
  },

  async stats(userId) {
    const [[totals]] = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(difficulty = 'Easy') as easy,
         SUM(difficulty = 'Medium') as medium,
         SUM(difficulty = 'Hard') as hard,
         SUM(status = 'Mastered') as mastered,
         SUM(next_revision_at IS NOT NULL AND next_revision_at <= NOW()) as due_today,
         SUM(status = 'Need Revision' OR status = 'In Revision') as need_revision
       FROM problems WHERE user_id = ?`,
      [userId]
    );
    const [patterns] = await pool.query(
      `SELECT primary_pattern, COUNT(*) as count FROM problems WHERE user_id = ? GROUP BY primary_pattern ORDER BY count DESC`,
      [userId]
    );
    return { totals, patterns };
  },
};

module.exports = Problem;
