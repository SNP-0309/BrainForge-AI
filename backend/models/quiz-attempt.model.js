const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true,
  },
  score: {
    type: Number,
    required: true,
  },
  maxScore: {
    type: Number,
    required: true,
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0,
  },
  xpEarned: {
    type: Number,
    default: 0,
  },
  coinsEarned: {
    type: Number,
    default: 0,
  },
  isPassed: {
    type: Boolean,
    default: false,
    index: true,
  },
  answers: [{
    questionIndex: { type: Number, required: true },
    selectedIndex: { type: Number, required: true },
  }],
}, {
  timestamps: true,
});

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = QuizAttempt;
