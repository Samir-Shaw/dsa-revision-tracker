require('dotenv').config();

function required(name, fallback = undefined) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    // Don't crash the whole app for optional keys like GEMINI_API_KEY;
    // only warn so classification gracefully degrades to manual mode.
    console.warn(`[config] Missing env var: ${name}`);
  }
  return val;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  jwtSecret: required('JWT_SECRET', 'dev_insecure_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'dsa_token',

  geminiApiKey: process.env.GEMINI_API_KEY || null,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
};
