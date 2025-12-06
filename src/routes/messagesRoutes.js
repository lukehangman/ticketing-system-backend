const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getTicketMessages, 
  sendMessage, 
  uploadAttachment 
} = require('../controllers/messagesController');
const upload = require('../middleware/uploadMiddleware'); // الميدل وير الموجود عندك

// جلب كل رسائل التذكرة
router.get('/tickets/:ticketId/messages', protect, getTicketMessages);

// إرسال رسالة جديدة
router.post('/tickets/:ticketId/messages', protect, sendMessage);

// رفع ملفات مرفقة
router.post('/tickets/:ticketId/messages/upload', protect, upload.single('file'), uploadAttachment);

module.exports = router;