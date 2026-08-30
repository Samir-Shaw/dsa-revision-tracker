/**
 * Seeds the demo/owner account with the 308-problem dataset.
 * This NEVER runs for regular signups — only for this explicit demo account,
 * created once via this script (or the "Explore Demo" flow, which points at it).
 *
 * Usage: npm run seed   (from /server)
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');

const DEMO_EMAIL = 'demo@dsarevisiontracker.app';
const DEMO_PASSWORD = 'DemoAccount123!'; // change after first login in production
const DEMO_NAME = 'Demo Account';

async function main() {
  const seedPath = path.join(__dirname, '..', 'seed', 'problems.json');
  const problems = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  console.log(`[seed] Loaded ${problems.length} problems from seed file`);

  const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ?', [DEMO_EMAIL]);
  let userId = existing?.id;

  if (!userId) {
    userId = uuidv4();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    await pool.query(
      'INSERT INTO users (id, name, email, password_hash, is_demo_account) VALUES (?, ?, ?, ?, 1)',
      [userId, DEMO_NAME, DEMO_EMAIL, passwordHash]
    );
    await pool.query(
      'INSERT INTO user_settings (id, user_id, theme, revision_schedule, default_practice_count) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, 'dark', JSON.stringify([1, 3, 7, 14, 30]), 10]
    );
    console.log(`[seed] Created demo account (${DEMO_EMAIL})`);
  } else {
    console.log('[seed] Demo account already exists, reusing it');
  }

  let inserted = 0, skipped = 0;
  for (const p of problems) {
    const [[exists]] = await pool.query(
      'SELECT id FROM problems WHERE user_id = ? AND leetcode_number = ?',
      [userId, p.leetcode_number]
    );
    if (exists) {
      skipped++;
      continue;
    }
    await pool.query(
      `INSERT INTO problems
       (id, user_id, leetcode_number, title, difficulty, primary_pattern, secondary_patterns,
        status, date_solved, leetcode_url, notes, is_favorite, revision_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        uuidv4(), userId, p.leetcode_number, p.title, p.difficulty, p.primary_pattern,
        JSON.stringify(p.secondary_patterns || []), p.status, p.date_solved,
        p.leetcode_url, p.notes,
      ]
    );
    inserted++;
  }

  console.log(`[seed] Inserted ${inserted} problems, skipped ${skipped} already present`);
  console.log(`[seed] Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await pool.end();
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
