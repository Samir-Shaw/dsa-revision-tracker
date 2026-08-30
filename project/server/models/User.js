const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const User = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, avatar_url, is_demo_account, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, email, passwordHash }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [id, name, email, passwordHash]
    );
    return this.findById(id);
  },

  async updatePassword(id, passwordHash) {
    await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [
      passwordHash,
      id,
    ]);
  },

  async setResetToken(id, token, expiresAt) {
    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [
      token,
      expiresAt,
      id,
    ]);
  },

  async findByResetToken(token) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1',
      [token]
    );
    return rows[0] || null;
  },

  async updateProfile(id, { name, avatarUrl }) {
    await pool.query('UPDATE users SET name = ?, avatar_url = ? WHERE id = ?', [name, avatarUrl, id]);
    return this.findById(id);
  },
};

module.exports = User;
