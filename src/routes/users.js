const express = require('express');
const {
  getUsers,
  getUser,
  getUserTickets,
  updateUser,
  deleteUser,
  updateProfile,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Profile route (for current user)
router.put('/profile', protect, updateProfile);

// Admin/Agent routes
router.get('/', protect, authorize('admin', 'agent'), getUsers);
router.get('/:id', protect, authorize('admin', 'agent'), getUser);
router.get('/:id/tickets', protect, authorize('admin', 'agent'), getUserTickets);

// Admin only routes
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
