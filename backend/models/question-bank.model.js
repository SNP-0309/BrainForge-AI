const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'multi-select', 'true-false', 'fill-blank', 'coding', 'descriptive'],
    required: true,
    default: 'mcq',
  },
  options: [{
    type: String,
    trim: true,
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // index for mcq, array for multi-select, string for others
    required: true,
  },
  explanation: {
    type: String,
    default: '',
  },
  codeTemplate: {
    type: String,
    default: '', // starter code for coding questions
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: { type: Boolean, default: false },
  }],
  topic: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  subject: {
    type: String,
    trim: true,
    default: '',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  examType: {
    type: String,
    enum: ['practice', 'mock', 'certification', 'competitive', 'custom', 'interview'],
    default: 'practice',
    index: true,
  },
  marks: {
    type: Number,
    default: 1,
  },
  negativeMark: {
    type: Number,
    default: 0,
  },
  timeLimit: {
    type: Number, // in seconds, 0 = no limit per question
    default: 0,
  },
  language: {
    type: String,
    default: '', // for coding questions: javascript, python, etc.
  },
  source: {
    type: String,
    enum: ['manual', 'ai-generated', 'imported'],
    default: 'manual',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

questionBankSchema.index({ topic: 1, difficulty: 1, examType: 1 });
questionBankSchema.index({ tags: 1 });

const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);
module.exports = QuestionBank;
