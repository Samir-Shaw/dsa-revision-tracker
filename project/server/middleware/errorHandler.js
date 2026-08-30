const { nodeEnv } = require('../config/env');

/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong. Please try again.' : err.message;

  const body = { error: message };
  if (nodeEnv === 'development' && err.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

module.exports = { errorHandler, AppError };
