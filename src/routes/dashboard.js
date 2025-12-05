const express = require('express');
const {
  getDashboardStats,
  getAnalytics,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/analytics', protect, authorize('admin', 'agent'), getAnalytics);

module.exports = router;
