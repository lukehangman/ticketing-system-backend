const Message = require('../models/Message');
const Ticket = require('../models/Ticket');

// @desc    Get messages for a ticket
// @route   GET /api/tickets/:ticketId/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check access rights
    if (
      req.user.role === 'customer' &&
      ticket.customer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these messages',
      });
    }

    const messages = await Message.find({ ticket: req.params.ticketId })
      .populate('sender', 'name email role')
      .sort('createdAt');

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a message
// @route   POST /api/tickets/:ticketId/messages
// @access  Private
exports.createMessage = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check access rights
    if (
      req.user.role === 'customer' &&
      ticket.customer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to post messages on this ticket',
      });
    }

    req.body.ticket = req.params.ticketId;
    req.body.sender = req.user.id;

    const message = await Message.create(req.body);

    const populatedMessage = await Message.findById(message._id).populate(
      'sender',
      'name email role'
    );

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private (Admin/Agent only)
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
