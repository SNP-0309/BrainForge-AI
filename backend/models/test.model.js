const mongoose = require('mongoose');

const testSectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  instructions: { type: String, default: '' },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionBank',
  }],
  timeLimit: { type: Number, default: 0 }, // section-level timer in minutes
}, { _id: false });

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['practice', 'chapter', 'mock', 'previous-year', 'certification', 'adaptive', 'custom'],
    required: true,
    default: 'practice',
    index: true,
  },
  subject: {
    type: String,
    trim: true,
    default: '',
  },
  topics: [{
    type: String,
    trim: true,
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  sections: [testSectionSchema],
  // Flat questions list (used when no sections)
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionBank',
  }],
  hasSections: {
    type: Boolean,
    default: false,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  passingMarks: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number, // total duration in minutes
    default: 60,
  },
  perQuestionTime: {
    type: Boolean,
    default: false, // if true, each question has its own timer
  },
  negativeMarking: {
    type: Boolean,
    default: false,
  },
  negativeMarkValue: {
    type: Number,
    default: 0.25, // marks deducted per wrong answer
  },
  shuffleQuestions: {
    type: Boolean,
    default: false,
  },
  shuffleOptions: {
    type: Boolean,
    default: false,
  },
  showResultImmediately: {
    type: Boolean,
    default: true,
  },
  allowPause: {
    type: Boolean,
    default: true, // disabled for certification/timed tests
  },
  proctoringEnabled: {
    type: Boolean,
    default: false,
  },
  fullscreenRequired: {
    type: Boolean,
    default: false,
  },
  isAdaptive: {
    type: Boolean,
    default: false,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed',
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  isAiGenerated: {
    type: Boolean,
    default: false,
  },
  attemptLimit: {
    type: Number,
    default: 0, // 0 = unlimited
  },
  certificateOnPass: {
    type: Boolean,
    default: false,
  },
  instructions: {
    type: String,
    default: '',
  },
  thumbnail: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

testSchema.index({ type: 1, subject: 1 });
testSchema.index({ topics: 1 });
testSchema.index({ tags: 1 });

const Test = mongoose.model('Test', testSchema);
module.exports = Test;
