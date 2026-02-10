const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['system', 'user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  userId: {
    type: String,
    default: 'anonymous'
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

chatHistorySchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
