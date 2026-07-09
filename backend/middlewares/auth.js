const admin = require('../config/firebase');
const User = require('../models/user.model');
const { UnauthorizedError, ForbiddenError } = require('../utils/CustomError');
const logger = require('../utils/logger');

// Verifies the Firebase token and sets req.firebaseUser
const verifyFirebaseToken = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('Please log in to access this resource'));
    }

    // Support mock verification in local development/test mode
    const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    const isMockToken = token === 'mock' || token.startsWith('mock-');

    if (isMockToken && isDevOrTest) {
      logger.warn('Mock token detected in development. Using fallback mock verification.');
      
      let uid = 'mock-uid-123';
      let email = 'mockuser@example.com';
      let name = 'Mock User';
      let role = 'student';

      if (token.startsWith('mock-admin')) {
        uid = 'mock-admin-uid';
        email = 'admin@brainforge.ai';
        name = 'Mock Admin';
        role = 'admin';
      } else if (token.startsWith('mock-teacher')) {
        uid = 'mock-teacher-uid';
        email = 'teacher@brainforge.ai';
        name = 'Mock Teacher';
        role = 'teacher';
      } else if (token.startsWith('mock-student')) {
        uid = 'mock-student-uid';
        email = 'student@brainforge.ai';
        name = 'Mock Student';
        role = 'student';
      } else if (token !== 'mock') {
        uid = `mock-${token}-uid`;
        email = `${token}@example.com`;
        name = `Mock ${token}`;
        if (token.includes('teacher')) role = 'teacher';
        if (token.includes('admin')) role = 'admin';
      }

      req.firebaseUser = { uid, email, name, role };
      return next();
    }

    if (!admin || !admin.apps || admin.apps.length === 0) {
      return next(new UnauthorizedError('Authentication service unavailable (Firebase Admin not initialized)'));
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    logger.warn(`Firebase token verification failed: ${error.message}`);
    return next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};

// Verifies token AND ensures user exists in local MongoDB
const protect = async (req, res, next) => {
  verifyFirebaseToken(req, res, async (err) => {
    if (err) return next(err);

    try {
      const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
      if (!user) {
        return next(new UnauthorizedError('User account not registered. Please sync account first.'));
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });
};

// Role-based authorization middleware
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
};

module.exports = {
  verifyFirebaseToken,
  protect,
  restrictTo,
};
