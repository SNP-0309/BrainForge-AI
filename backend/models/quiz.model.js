const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true,
    default: null,
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    index: true,
    default: null,
  },
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    points: { type: Number, default: 10 },
    explanation: { type: String, default: '' },
  }],
  timeLimit: {
    type: Number,
    default: 300, // in seconds
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    index: true,
  },
  isAiGenerated: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
