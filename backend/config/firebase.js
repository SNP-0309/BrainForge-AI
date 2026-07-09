const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const logger = require('../utils/logger');

let firebaseApp = null;

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

    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: storageBucket || undefined,
    });

    logger.info(`Firebase Admin SDK initialized successfully.`);
  } else {
    logger.warn('FIREBASE_SERVICE_ACCOUNT environment variable is missing. Firebase requests will require mock verification or will fail.');
  }
} catch (error) {
  logger.error(`Firebase Admin SDK init error: ${error.message}`);
}

module.exports = {
  get apps() {
    return getApps();
  },
  auth() {
    return getAuth(firebaseApp || undefined);
  },
  storage() {
    return getStorage(firebaseApp || undefined);
  }
};
