const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionBank',
    required: true,
  },
  sectionIndex: {
    type: Number,
    default: 0,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // index, array, string depending on question type
    default: null,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  marksAwarded: {
    type: Number,
    default: 0,
  },
  timeTaken: {
    type: Number, // seconds spent on this question
    default: 0,
  },
  isMarkedForReview: {
    type: Boolean,
    default: false,
  },
  isSkipped: {
    type: Boolean,
    default: false,
  },
  aiEvaluation: {
    score: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    isEvaluated: { type: Boolean, default: false },
  },
}, { _id: false });

const testAttemptSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['in-progress', 'paused', 'submitted', 'auto-submitted', 'abandoned'],
    default: 'in-progress',
    index: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  pausedAt: {
    type: Date,
    default: null,
  },
  totalPausedDuration: {
    type: Number, // seconds
    default: 0,
  },
  timeRemaining: {
    type: Number, // seconds remaining when paused/submitted
    default: 0,
  },
  currentSection: {
    type: Number,
    default: 0,
  },
  currentQuestion: {
    type: Number,
    default: 0,
  },
  answers: [answerSchema],
  score: {
    type: Number,
    default: 0,
  },
  maxScore: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  passed: {
    type: Boolean,
    default: false,
  },
  rank: {
    type: Number,
    default: null,
  },
  percentile: {
    type: Number,
    default: null,
  },
  sectionScores: [{
    sectionName: String,
    score: Number,
    maxScore: Number,
    correctCount: Number,
    wrongCount: Number,
    skippedCount: Number,
  }],
  topicAnalysis: [{
    topic: String,
    correct: Number,
    wrong: Number,
    total: Number,
    accuracy: Number,
  }],
  aiAnalysis: {
    weakTopics: [String],
    strongTopics: [String],
    recommendations: [String],
    summary: { type: String, default: '' },
    generatedAt: { type: Date, default: null },
  },
  proctoringFlagCount: {
    type: Number,
    default: 0,
  },
  certificateIssued: {
    type: Boolean,
    default: false,
  },
  certificateUrl: {
    type: String,
    default: '',
  },
  attemptNumber: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

testAttemptSchema.index({ test: 1, user: 1 });
testAttemptSchema.index({ user: 1, status: 1 });

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);
module.exports = TestAttempt;
