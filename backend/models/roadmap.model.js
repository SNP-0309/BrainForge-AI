const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  nodes: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['lesson', 'quiz', 'milestone'],
      default: 'lesson',
    },
    status: {
      type: String,
      enum: ['locked', 'available', 'completed'],
      default: 'locked',
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    dependencies: [{
      type: String, // ID of dependent nodes
    }],
  }],
  isCompleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap;
