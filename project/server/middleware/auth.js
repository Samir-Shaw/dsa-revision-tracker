const { verifyToken } = require('../utils/jwt');
const { cookieName } = require('../config/env');

/**
 * requireAuth
 * The authenticated user id is ALWAYS derived from the verified JWT —
 * never from req.body.user_id, req.params.user_id, or req.query.user_id.
 * Every downstream controller must use req.userId, not any client-supplied id.
 */
function requireAuth(req, res, next) {
  const token = req.cookies?.[cookieName];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { requireAuth };
