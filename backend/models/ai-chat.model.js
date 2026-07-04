const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New AI Chat Session',
  },
  provider: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

const AIChat = mongoose.model('AIChat', aiChatSchema);

module.exports = AIChat;
