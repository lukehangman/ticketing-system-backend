const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
exports.getTickets = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // Role-based filtering
    if (req.user.role === 'customer') {
      reqQuery.customer = req.user.id;
    } else if (req.user.role === 'agent') {
      // Agents can see tickets assigned to them or unassigned
      if (!reqQuery.assignedTo && !reqQuery.status) {
        reqQuery.$or = [
          { assignedTo: req.user.id },
          { assignedTo: { $exists: false } },
        ];
      }
    }

    // Finding resource
    query = Ticket.find(reqQuery)
      .populate('customer', 'name email')
      .populate('assignedTo', 'name email')
      .populate('company', 'name');

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Ticket.countDocuments(reqQuery);

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const tickets = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      pagination,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('company', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check access rights
    if (
      req.user.role === 'customer' &&
      ticket.customer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this ticket',
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res, next) => {
  try {
    // Set customer to logged in user if customer
    if (req.user.role === 'customer') {
      req.body.customer = req.user.id;
      req.body.company = req.user.company;
    }

    const ticket = await Ticket.create(req.body);

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res, next) => {
  try {
    let ticket = await Ticket.findById(req.params.id);

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
        message: 'Not authorized to update this ticket',
      });
    }

    // Customers can only update certain fields
    if (req.user.role === 'customer') {
      const allowedUpdates = ['title', 'description', 'priority'];
      Object.keys(req.body).forEach((key) => {
        if (!allowedUpdates.includes(key)) {
          delete req.body[key];
        }
      });
    }

    // Update resolved/closed timestamps
    if (req.body.status === 'resolved' && ticket.status !== 'resolved') {
      req.body.resolvedAt = Date.now();
    }

    if (req.body.status === 'closed' && ticket.status !== 'closed') {
      req.body.closedAt = Date.now();
    }

    ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('customer', 'name email')
      .populate('assignedTo', 'name email')
      .populate('company', 'name');

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin only)
exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    await ticket.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
