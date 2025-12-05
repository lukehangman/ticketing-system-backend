const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Company = require('../models/Company');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get ticket counts by status
    const ticketStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object for easier access
    const statusCounts = {
      open: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0,
    };

    ticketStats.forEach((stat) => {
      statusCounts[stat._id] = stat.count;
    });

    // Get total counts
    const totalTickets = await Ticket.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalCompanies = await Company.countDocuments();

    // Get recent tickets
    let recentTicketsQuery = Ticket.find()
      .populate('customer', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-createdAt')
      .limit(5);

    // Role-based filtering for recent tickets
    if (req.user.role === 'customer') {
      recentTicketsQuery = Ticket.find({ customer: req.user.id })
        .populate('assignedTo', 'name email')
        .sort('-createdAt')
        .limit(5);
    } else if (req.user.role === 'agent') {
      recentTicketsQuery = Ticket.find({
        $or: [{ assignedTo: req.user.id }, { assignedTo: { $exists: false } }],
      })
        .populate('customer', 'name email')
        .sort('-createdAt')
        .limit(5);
    }

    const recentTickets = await recentTicketsQuery;

    // Get priority distribution
    const priorityStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get category distribution
    const categoryStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        openTickets: statusCounts.open,
        inProgress: statusCounts['in-progress'],
        resolved: statusCounts.resolved,
        closed: statusCounts.closed,
        totalUsers,
        totalCompanies,
        recentTickets,
        statusDistribution: statusCounts,
        priorityDistribution: priorityStats,
        categoryDistribution: categoryStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics data
// @route   GET /api/analytics/dashboard
// @access  Private (Admin/Agent)
exports.getAnalytics = async (req, res, next) => {
  try {
    // Get tickets created over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ticketTrends = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Status distribution
    const statusDistribution = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Priority distribution
    const priorityDistribution = await Ticket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Average resolution time
    const resolvedTickets = await Ticket.find({
      status: 'resolved',
      resolvedAt: { $exists: true },
    }).select('createdAt resolvedAt');

    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((acc, ticket) => {
        const diff = ticket.resolvedAt - ticket.createdAt;
        return acc + diff;
      }, 0);
      avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
    }

    res.status(200).json({
      success: true,
      data: {
        ticketTrends,
        statusDistribution,
        priorityDistribution,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        totalResolved: resolvedTickets.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
