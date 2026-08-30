const { pool } = require('../config/db');

async function computeStreak(userId) {
  // Active day = solved, revised, or practiced. Union of distinct activity dates, desc.
  const [rows] = await pool.query(
    `SELECT activity_date FROM (
       SELECT DATE(date_solved) as activity_date FROM problems WHERE user_id = ? AND date_solved IS NOT NULL
       UNION
       SELECT DATE(revision_date) as activity_date FROM revisions WHERE user_id = ?
       UNION
       SELECT DATE(practice_date) as activity_date FROM practice_sessions WHERE user_id = ?
     ) AS activity
     ORDER BY activity_date DESC`,
    [userId, userId, userId]
  );

  if (rows.length === 0) return { current: 0, longest: 0 };

  const dates = rows.map((r) => new Date(r.activity_date));
  let current = 0, longest = 0, streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Longest streak: walk consecutive-day runs.
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const diffDays = Math.round((dates[i - 1] - dates[i]) / 86400000);
      streak = diffDays === 1 ? streak + 1 : 1;
    }
    longest = Math.max(longest, streak);
  }

  // Current streak: only counts if the most recent activity was today or yesterday.
  const mostRecentDiff = Math.round((today - dates[0]) / 86400000);
  if (mostRecentDiff <= 1) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      const diffDays = Math.round((dates[i - 1] - dates[i]) / 86400000);
      if (diffDays === 1) current++;
      else break;
    }
  }

  return { current, longest };
}

async function getAnalytics(req, res, next) {
  try {
    const userId = req.userId;

    const [[totals]] = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(difficulty = 'Easy') as easy,
         SUM(difficulty = 'Medium') as medium,
         SUM(difficulty = 'Hard') as hard,
         SUM(status = 'Mastered') as mastered,
         SUM(next_revision_at IS NOT NULL AND next_revision_at <= NOW()) as revision_due
       FROM problems WHERE user_id = ?`,
      [userId]
    );

    const [patternDist] = await pool.query(
      `SELECT primary_pattern, COUNT(*) as count FROM problems WHERE user_id = ? GROUP BY primary_pattern ORDER BY count DESC`,
      [userId]
    );

    const [solvedOverTime] = await pool.query(
      `SELECT DATE_FORMAT(date_solved, '%Y-%m') as month, COUNT(*) as count
       FROM problems WHERE user_id = ? AND date_solved IS NOT NULL
       GROUP BY month ORDER BY month ASC`,
      [userId]
    );

    const [revisionActivity] = await pool.query(
      `SELECT DATE(revision_date) as day, result, COUNT(*) as count
       FROM revisions WHERE user_id = ? GROUP BY day, result ORDER BY day ASC LIMIT 500`,
      [userId]
    );

    const [[practiceAccuracy]] = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(result IN ('Remembered','Solved')) as correct
       FROM practice_sessions WHERE user_id = ?`,
      [userId]
    );

    const [patternAccuracy] = await pool.query(
      `SELECT p.primary_pattern,
              COUNT(*) as total,
              SUM(ps.result IN ('Remembered','Solved')) as correct
       FROM practice_sessions ps
       JOIN problems p ON p.id = ps.problem_id
       WHERE ps.user_id = ?
       GROUP BY p.primary_pattern`,
      [userId]
    );

    const streak = await computeStreak(userId);

    res.json({
      totals,
      patternDistribution: patternDist,
      solvedOverTime,
      revisionActivity,
      practiceAccuracy: {
        total: practiceAccuracy.total || 0,
        correct: practiceAccuracy.correct || 0,
        rate: practiceAccuracy.total ? Math.round((practiceAccuracy.correct / practiceAccuracy.total) * 100) : null,
      },
      patternAccuracy: patternAccuracy.map((p) => ({
        pattern: p.primary_pattern,
        total: p.total,
        correct: p.correct,
        rate: p.total ? Math.round((p.correct / p.total) * 100) : null,
      })),
      streak,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics };
