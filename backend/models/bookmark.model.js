const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  itemType: {
    type: String,
    enum: ['Lesson', 'Course', 'Note'],
    required: true,
    index: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType',
    index: true,
  },
}, {
  timestamps: true,
});

// A user can bookmark an item only once
bookmarkSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
