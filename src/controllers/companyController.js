const Company = require('../models/Company');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private (Admin)
exports.getCompanies = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Search
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const total = await Company.countDocuments(query);

    const companies = await Company.find(query)
      .skip(startIndex)
      .limit(limit)
      .sort('-createdAt');

    // Get user and ticket counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const userCount = await User.countDocuments({ company: company._id });
        const ticketCount = await Ticket.countDocuments({ company: company._id });

        return {
          ...company.toObject(),
          userCount,
          ticketCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: companiesWithStats.length,
      total,
      data: companiesWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Private (Admin)
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    // Get users and tickets for this company
    const users = await User.find({ company: req.params.id }).select('name email role');
    const tickets = await Ticket.find({ company: req.params.id })
      .populate('customer', 'name email')
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        ...company.toObject(),
        users,
        tickets,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create company
// @route   POST /api/companies
// @access  Private (Admin)
exports.createCompany = async (req, res, next) => {
  try {
    const company = await Company.create(req.body);

    res.status(201).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (Admin)
exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Admin)
exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    await company.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
