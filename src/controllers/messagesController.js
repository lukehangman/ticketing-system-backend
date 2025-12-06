const ChatMessage = require('../models/ChatMessage');
const Ticket = require('../models/Ticket');

// @desc    جلب جميع رسائل التذكرة
// @route   GET /api/tickets/:ticketId/messages
// @access  Private (صاحب التذكرة أو Admin/Agent)
const getTicketMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // جلب التذكرة
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'التذكرة غير موجودة' });
    }

    // التحقق من الصلاحيات
    const isOwner = ticket.user.toString() === userId.toString();
    const isStaff = userRole === 'admin' || userRole === 'agent';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'غير مصرح لك بالوصول لهذه المحادثة' });
    }

    // جلب الرسائل
    const messages = await ChatMessage.find({ ticket: ticketId })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 }); // من الأقدم للأحدث

    res.json({
      success: true,
      count: messages.length,
      messages
    });

  } catch (error) {
    console.error('خطأ في جلب الرسائل:', error);
    res.status(500).json({ message: 'خطأ في السيرفر', error: error.message });
  }
};

// @desc    إرسال رسالة جديدة
// @route   POST /api/tickets/:ticketId/messages
// @access  Private (صاحب التذكرة أو Admin/Agent)
const sendMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, attachments } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // التحقق من وجود رسالة
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'الرسالة فارغة' });
    }

    // جلب التذكرة
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'التذكرة غير موجودة' });
    }

    // التحقق من الصلاحيات
    const isOwner = ticket.user.toString() === userId.toString();
    const isStaff = userRole === 'admin' || userRole === 'agent';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'غير مصرح لك بالمراسلة في هذه التذكرة' });
    }

    // إنشاء الرسالة
    const newMessage = await ChatMessage.create({
      ticket: ticketId,
      sender: userId,
      message: message.trim(),
      attachments: attachments || []
    });

    // تحديث آخر نشاط للتذكرة
    ticket.updatedAt = Date.now();
    
    // لو العميل رد، نغيّر حالة التذكرة من pending لـ open
    if (isOwner && ticket.status === 'pending') {
      ticket.status = 'open';
    }
    
    await ticket.save();

    // جلب الرسالة مع بيانات المرسل
    const populatedMessage = await ChatMessage.findById(newMessage._id)
      .populate('sender', 'name email role');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });

  } catch (error) {
    console.error('خطأ في إرسال الرسالة:', error);
    res.status(500).json({ message: 'خطأ في السيرفر', error: error.message });
  }
};

// @desc    رفع ملف مرفق
// @route   POST /api/tickets/:ticketId/messages/upload
// @access  Private
const uploadAttachment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم رفع أي ملف' });
    }

    // جلب التذكرة والتحقق من الصلاحيات
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'التذكرة غير موجودة' });
    }

    const isOwner = ticket.user.toString() === userId.toString();
    const isStaff = userRole === 'admin' || userRole === 'agent';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'غير مصرح لك بالرفع' });
    }

    // رجوع رابط الملف
    const fileUrl = `/uploads/${req.file.filename}`; // أو أي path تستخدمه

    res.json({
      success: true,
      fileUrl
    });

  } catch (error) {
    console.error('خطأ في رفع الملف:', error);
    res.status(500).json({ message: 'خطأ في السيرفر', error: error.message });
  }
};

module.exports = {
  getTicketMessages,
  sendMessage,
  uploadAttachment
};