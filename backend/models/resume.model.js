const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fileUrl: {
    type: String, // Firebase Storage URL
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  extractedText: {
    type: String,
    default: '', // parsed text content from the PDF
  },
  atsScore: {
    type: Number,
    default: 0, // 0-100 ATS compatibility score
  },
  keywordMatch: {
    matched: [String],
    missing: [String],
    score: { type: Number, default: 0 },
  },
  sectionFeedback: {
    summary: { type: String, default: '' },
    experience: { type: String, default: '' },
    education: { type: String, default: '' },
    skills: { type: String, default: '' },
    projects: { type: String, default: '' },
    overall: { type: String, default: '' },
  },
  jobMatchScore: {
    type: Number,
    default: 0,
  },
  jobDescription: {
    type: String,
    default: '',
  },
  jobTitle: {
    type: String,
    default: '',
  },
  suggestedQuestions: [String], // AI-generated interview questions based on resume
  coverLetterDraft: {
    type: String,
    default: '',
  },
  isAnalyzed: {
    type: Boolean,
    default: false,
  },
  analyzedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;
