const mongoose = require('mongoose');

const proctoringLogSchema = new mongoose.Schema({
  testAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAttempt',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  events: [{
    type: {
      type: String,
      enum: [
        'tab-switch',
        'window-blur',
        'copy-attempt',
        'paste-attempt',
        'right-click',
        'fullscreen-exit',
        'multiple-faces',
        'no-face',
        'face-absent',
        'phone-detected',
        'unknown-person',
        'ai-flag',
      ],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    description: {
      type: String,
      default: '',
    },
    snapshotUrl: {
      type: String, // Firebase Storage URL of the snapshot
      default: '',
    },
    questionIndex: {
      type: Number,
      default: 0,
    },
  }],
  totalFlags: {
    type: Number,
    default: 0,
  },
  riskLevel: {
    type: String,
    enum: ['clean', 'low', 'medium', 'high', 'flagged'],
    default: 'clean',
    index: true,
  },
  reviewed: {
    type: Boolean,
    default: false,
    index: true,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewNotes: {
    type: String,
    default: '',
  },
  consentGiven: {
    type: Boolean,
    default: false, // user must consent to webcam before proctoring starts
  },
  dataRetentionExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days retention
  },
}, {
  timestamps: true,
});

proctoringLogSchema.index({ riskLevel: 1, reviewed: 1 });

const ProctoringLog = mongoose.model('ProctoringLog', proctoringLogSchema);
module.exports = ProctoringLog;
