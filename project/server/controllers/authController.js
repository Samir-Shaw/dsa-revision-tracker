const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { signToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');
const { cookieName, nodeEnv } = require('../config/env');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: nodeEnv === 'production',
  sameSite: nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function setAuthCookie(res, userId) {
  const token = signToken({ userId });
  res.cookie(cookieName, token, COOKIE_OPTIONS);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !name.trim()) throw new AppError('Name is required');
    if (!email || !EMAIL_RE.test(email)) throw new AppError('A valid email is required');
    if (!password || password.length < 8) throw new AppError('Password must be at least 8 characters');
    if (password !== confirmPassword) throw new AppError('Passwords do not match');

    const existing = await User.findByEmail(email.toLowerCase().trim());
    if (existing) throw new AppError('An account with this email already exists', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash });

    // Every new user gets an empty settings row — NOT the 308-problem demo dataset.
    await pool.query(
      'INSERT INTO user_settings (id, user_id, theme, revision_schedule, default_practice_count) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), user.id, 'dark', JSON.stringify([1, 3, 7, 14, 30]), 10]
    );

    setAuthCookie(res, user.id);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password are required');

    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) throw new AppError('Invalid email or password', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Invalid email or password', 401);

    setAuthCookie(res, user.id);
    const { password_hash, reset_token, reset_token_expires, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie(cookieName, { ...COOKIE_OPTIONS, maxAge: undefined });
  res.json({ success: true });
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError('User not found', 404);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findByEmail((email || '').toLowerCase().trim());

    // Always respond the same way whether or not the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await User.setResetToken(user.id, token, expires);
      // TODO: send email with reset link containing `token`.
      // Wire up an email provider (e.g. Resend, SES, SendGrid) here.
      if (nodeEnv !== 'production') {
        console.log(`[dev] Password reset token for ${email}: ${token}`);
      }
    }

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      throw new AppError('A valid token and an 8+ character password are required');
    }

    const user = await User.findByResetToken(token);
    if (!user) throw new AppError('Reset link is invalid or has expired', 400);

    const passwordHash = await bcrypt.hash(password, 12);
    await User.updatePassword(user.id, passwordHash);

    res.json({ message: 'Password updated. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters');
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    const user = rows[0];
    const valid = await bcrypt.compare(currentPassword || '', user.password_hash);
    if (!valid) throw new AppError('Current password is incorrect', 401);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(req.userId, passwordHash);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, forgotPassword, resetPassword, changePassword };
