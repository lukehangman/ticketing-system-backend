const express = require('express');
const router = express.Router();

// middleware الصحيح
const { protect } = require('../middleware/auth');

// لرفع الملفات
const upload = require('../middleware/upload');

// الكنترولرز
const {
  getTicketMessages,
  sendMessage,
  uploadAttachment,
} = require('../controllers/messagesController');

// =============================
//       GET Messages
// =============================
router.get(
  '/tickets/:ticketId/messages',
  protect,
  getTicketMessages
);

// =============================
//       SEND Message
// =============================
router.post(
  '/tickets/:ticketId/messages',
  protect,
  sendMessage
);

// =============================
//       UPLOAD Attachment
// =============================
router.post(
  '/tickets/:ticketId/messages/upload',
  protect,
  upload.single('file'),
  uploadAttachment
);

module.exports = router;
