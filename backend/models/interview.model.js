const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['interviewer', 'candidate', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewQuestionBank',
    default: null,
  },
  isFollowUp: {
    type: Boolean,
    default: false,
  },
  audioUrl: {
    type: String, // Firebase Storage URL for voice responses
    default: '',
  },
  videoUrl: {
    type: String, // Firebase Storage URL for video segments
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const aiFeedbackSchema = new mongoose.Schema({
  overallScore: { type: Number, default: 0 }, // 0-100
  technicalScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0 },
  structureScore: { type: Number, default: 0 }, // STAR/framework usage
  strengthPoints: [String],
  improvementPoints: [String],
  suggestedResources: [String],
  detailedFeedback: { type: String, default: '' },
  questionWiseFeedback: [{
    questionIndex: Number,
    score: Number,
    feedback: String,
    idealAnswer: String,
  }],
  generatedAt: { type: Date, default: null },
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  format: {
    type: String,
    enum: ['text', 'voice', 'video'],
    required: true,
    default: 'text',
  },
  interviewType: {
    type: String,
    enum: ['technical', 'behavioral', 'hr', 'mixed', 'system-design', 'coding'],
    required: true,
    default: 'mixed',
    index: true,
  },
  role: {
    type: String,
    trim: true,
    default: 'Software Engineer',
  },
  company: {
    type: String,
    trim: true,
    default: '',
  },
  yearsOfExperience: {
    type: String,
    enum: ['fresher', '1-2', '3-5', '5-10', '10+'],
    default: 'fresher',
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress',
    index: true,
  },
  messages: [messageSchema],
  questionsAsked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewQuestionBank',
  }],
  currentQuestionIndex: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    default: 10,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number, // minutes
    default: 30,
  },
  aiFeedback: aiFeedbackSchema,
  resumeContext: {
    type: String, // extracted text from resume for context-aware questions
    default: '',
  },
  jobDescription: {
    type: String,
    default: '',
  },
  recordingUrl: {
    type: String, // Firebase Storage URL of the full session recording
    default: '',
  },
  aiProvider: {
    type: String,
    enum: ['gemini', 'groq'],
    default: 'groq',
  },
}, {
  timestamps: true,
});

const Interview = mongoose.model('Interview', interviewSchema);
module.exports = Interview;
