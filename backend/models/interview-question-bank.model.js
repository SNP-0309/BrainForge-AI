const mongoose = require('mongoose');

const interviewQuestionBankSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['technical', 'behavioral', 'hr', 'system-design', 'case-study', 'aptitude', 'group-discussion'],
    required: true,
    index: true,
  },
  subCategory: {
    type: String,
    trim: true,
    default: '',
    // e.g. 'arrays', 'trees', 'react', 'leadership', etc.
  },
  role: {
    type: String,
    trim: true,
    default: '',
    // SDE, Data Analyst, Product Manager, etc.
    index: true,
  },
  company: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
    // google, amazon, microsoft, etc.
    index: true,
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
  sampleAnswer: {
    type: String,
    default: '',
  },
  followUpQuestions: [{
    type: String,
    trim: true,
  }],
  tips: {
    type: String,
    default: '',
  },
  answerFramework: {
    type: String,
    enum: ['STAR', 'CAR', 'SOAR', 'none'],
    default: 'none', // for behavioral questions
  },
  frequency: {
    type: String,
    enum: ['very-common', 'common', 'occasional', 'rare'],
    default: 'common',
  },
  language: {
    type: String,
    default: '', // for technical coding questions
  },
  codeTemplate: {
    type: String,
    default: '',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  source: {
    type: String,
    enum: ['manual', 'ai-generated', 'community'],
    default: 'manual',
  },
}, {
  timestamps: true,
});

interviewQuestionBankSchema.index({ category: 1, role: 1, difficulty: 1 });
interviewQuestionBankSchema.index({ company: 1, category: 1 });
interviewQuestionBankSchema.index({ tags: 1 });

const InterviewQuestionBank = mongoose.model('InterviewQuestionBank', interviewQuestionBankSchema);
module.exports = InterviewQuestionBank;
