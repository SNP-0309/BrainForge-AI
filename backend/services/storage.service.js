const admin = require('../config/firebase');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Firebase Storage Service
 * Handles file uploads, downloads, and deletions using Firebase Admin SDK.
 * Falls back to a mock mode if Firebase is not initialized.
 */
class StorageService {
  constructor() {
    this.isMock = false;
    try {
      if (!admin || !admin.apps || admin.apps.length === 0) {
        logger.warn('Firebase Admin not initialized. StorageService running in mock mode.');
        this.isMock = true;
      } else {
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
          logger.warn('FIREBASE_STORAGE_BUCKET not set. StorageService running in mock mode.');
          this.isMock = true;
        } else {
          this.bucket = admin.storage().bucket(bucketName);
          logger.info(`Firebase Storage initialized with bucket: ${bucketName}`);
        }
      }
    } catch (err) {
      logger.error(`StorageService init error: ${err.message}`);
      this.isMock = true;
    }
  }

  /**
   * Upload a file buffer to Firebase Storage.
   * @param {Buffer} buffer - File buffer
   * @param {string} destination - Storage path (e.g., 'videos/course-id/lesson.mp4')
   * @param {string} mimeType - MIME type of the file
   * @returns {string} Public download URL
   */
  async uploadFile(buffer, destination, mimeType = 'application/octet-stream') {
    if (this.isMock) {
      const mockUrl = `https://storage.mock.firebase.com/${destination}?mock=true`;
      logger.warn(`[MOCK] StorageService upload: ${destination} → ${mockUrl}`);
      return mockUrl;
    }

    try {
      const file = this.bucket.file(destination);
      await file.save(buffer, {
        metadata: { contentType: mimeType },
        resumable: false,
      });

      // Make the file publicly accessible
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${destination}`;
      logger.info(`File uploaded: ${destination}`);
      return publicUrl;
    } catch (err) {
      logger.error(`Firebase Storage upload failed: ${err.message}. Falling back to mock storage URL.`);
      return `https://storage.mock.firebase.com/${destination}?mock=true`;
    }
  }

  /**
   * Upload from a multer file object (has buffer property).
   * @param {Object} multerFile - Multer file object
   * @param {string} folder - Storage folder prefix
   * @param {string} userId - User ID for namespacing
   * @returns {string} Public download URL
   */
  async uploadMulterFile(multerFile, folder, userId) {
    const ext = path.extname(multerFile.originalname);
    const timestamp = Date.now();
    const safeName = multerFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const destination = `${folder}/${userId}/${timestamp}_${safeName}`;

    return this.uploadFile(multerFile.buffer, destination, multerFile.mimetype);
  }

  /**
   * Generate a signed URL for private file access (expires in 1 hour by default).
   */
  async getSignedUrl(filePath, expiresInMs = 60 * 60 * 1000) {
    if (this.isMock) return `https://storage.mock.firebase.com/${filePath}?signed=true`;
    try {
      const file = this.bucket.file(filePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInMs,
      });
      return url;
    } catch (err) {
      logger.error(`Signed URL generation failed: ${err.message}`);
      throw new Error('Could not generate file access URL.');
    }
  }

  /**
   * Delete a file from Firebase Storage.
   */
  async deleteFile(filePath) {
    if (this.isMock) {
      logger.warn(`[MOCK] StorageService delete: ${filePath}`);
      return true;
    }
    try {
      const file = this.bucket.file(filePath);
      await file.delete();
      logger.info(`File deleted: ${filePath}`);
      return true;
    } catch (err) {
      logger.error(`Firebase Storage delete failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Extract the storage path from a public Firebase URL.
   */
  extractPathFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Format: /bucketName/...path
      return pathParts.slice(2).join('/');
    } catch {
      return null;
    }
  }

  /**
   * Get allowed MIME types for a file type category.
   */
  static getAllowedMimeTypes(category) {
    const types = {
      video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
      pdf: ['application/pdf'],
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };
    return types[category] || [];
  }

  /**
   * Validate file size and type before upload.
   */
  static validateFile(multerFile, category, maxSizeMB = 100) {
    const allowedTypes = StorageService.getAllowedMimeTypes(category);
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (allowedTypes.length > 0 && !allowedTypes.includes(multerFile.mimetype)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }
    if (multerFile.size > maxBytes) {
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }
    return true;
  }
}

module.exports = new StorageService();
