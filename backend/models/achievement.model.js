const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  badgeUrl: {
    type: String,
    required: true,
  },
  criteriaType: {
    type: String,
    enum: ['course_completed', 'quiz_score', 'streak', 'xp_earned'],
    required: true,
    index: true,
  },
  criteriaValue: {
    type: Number,
    required: true,
  },
  pointsXP: {
    type: Number,
    default: 50,
  },
}, {
  timestamps: true,
});

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
