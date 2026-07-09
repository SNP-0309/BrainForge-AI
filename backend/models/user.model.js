const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student',
    index: true,
  },
  profile: {
    avatar: {
      type: String,
      default: '',
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    coins: {
      type: Number,
      default: 0,
    },
    dailyStreak: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    chosenCareerPath: {
      type: String,
      default: '',
    },
    assessmentCompleted: {
      type: Boolean,
      default: false,
    },
    assessmentRecommendations: {
      type: Array,
      default: [],
    },
    dailyMission: {
      date: {
        type: Date,
        default: null,
      },
      tasks: [{
        id: String,
        label: String,
        completed: {
          type: Boolean,
          default: false,
        },
        type: {
          type: String,
          default: 'lesson',
        },
      }],
      claimed: {
        type: Boolean,
        default: false,
      },
    },
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
