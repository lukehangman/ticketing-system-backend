const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    type: String // URLs للملفات المرفقة
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ترتيب الرسائل من الأقدم للأحدث
chatMessageSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);