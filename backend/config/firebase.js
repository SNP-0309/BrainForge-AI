const admin = require('firebase-admin');
const logger = require('../utils/logger');

try {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountVar) {
    let serviceAccount;
    if (serviceAccountVar.trim().startsWith('{')) {
      serviceAccount = JSON.parse(serviceAccountVar);
    } else {
      // Treat as file path
      serviceAccount = require(serviceAccountVar);
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    logger.info('Firebase Admin SDK initialized successfully');
  } else {
    logger.warn('FIREBASE_SERVICE_ACCOUNT environment variable is missing. Firebase requests will require mock verification or will fail.');
  }
} catch (error) {
  logger.error(`Error initializing Firebase Admin SDK: ${error.message}`);
}

module.exports = admin;
