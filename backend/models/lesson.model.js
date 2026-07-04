const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true, // Markdown supported
  },
  videoUrl: {
    type: String,
    default: '',
  },
  resources: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
  }],
  order: {
    type: Number,
    required: true,
  },
  estimatedTime: {
    type: Number,
    default: 15, // in minutes
  },
  isAiGenerated: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index to guarantee order per course is unique
lessonSchema.index({ course: 1, order: 1 }, { unique: true });

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;
