const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/permissions');

/* 
 * Looking at the error message and the userController exports, 
 * we need to comment out or implement routes that use undefined controller functions
 */

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', userController.getUsers);

// For development testing only - remove in production
// @route   GET /api/users/mock
// @desc    Get mock users for development
// @access  Public
router.get('/mock', (req, res) => {
  // Always return mock data, regardless of database connection
  console.log('Serving mock user data');
  const mockUsers = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      permissions: {
        canAccessDashboard: true,
        canManageUsers: true,
        canManageContent: true,
        canViewAnalytics: true
      },
      emailVerified: true,
      createdAt: new Date()
    },
    {
      id: 2,
      name: 'Regular User',
      email: 'user@example.com',
      role: 'regular',
      permissions: {
        canAccessDashboard: true,
        canManageUsers: false,
        canManageContent: false,
        canViewAnalytics: true
      },
      emailVerified: true,
      createdAt: new Date()
    },
    {
      id: 3,
      name: 'Authorized User',
      email: 'authorized@example.com',
      role: 'authorized',
      permissions: {
        canAccessDashboard: true,
        canManageUsers: false,
        canManageContent: true,
        canViewAnalytics: true
      },
      emailVerified: false,
      createdAt: new Date()
    }
  ];
  
  res.json(mockUsers);
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', auth, userController.getUserById);

// @route   POST /api/users
// @desc    Create a new user
// @access  Public
router.post('/', userController.registerUser);

// @route   POST /api/users/verify-otp
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-otp', userController.verifyOTPAndActivateAccount);

// @route   POST /api/users/resend-otp
// @desc    Resend OTP for email verification
// @access  Public
router.post('/resend-otp', userController.resendOTP);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', userController.loginUser);

// @route   PUT /api/users/password
// @desc    Update user password
// @access  Private
router.put('/password', auth, authController.updatePassword);

// @route   GET /api/users/me
// @desc    Get user profile
// @access  Private
router.get('/me', auth, userController.getUserProfile);

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private/Admin
router.put('/:id', auth, userController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id', auth, userController.deleteUser);

// @route   GET /api/users/:id/audit-logs
// @desc    Get user audit logs
// @access  Private/Admin
router.get('/:id/audit-logs', auth, userController.getUserAuditLogs);

// @route   PUT /api/users/profile/me
// @desc    Update current user profile
// @access  Private
router.put('/profile/me', auth, userController.updateCurrentUserProfile);

// @route   PUT /api/users/:id/permissions
// @desc    Update user permissions
// @access  Private/Admin
router.put('/:id/permissions', auth, userController.updateUserPermissions);

module.exports = router;
