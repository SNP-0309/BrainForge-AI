const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log critical/server errors
  if (err.statusCode >= 500) {
    logger.error(`Server Error: ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`Client Operational Error: ${err.message}`);
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const match = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/) : null;
    const value = match ? match[0] : 'duplicate value';
    return res.status(400).json({
      success: false,
      message: `Duplicate field value: ${value}. Please use another value!`,
    });
  }

  // Handle validation errors (Zod / Mongoose)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Zod parsing errors
  if (err.issues) {
    const errors = err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Send structured response
  res.status(err.statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
