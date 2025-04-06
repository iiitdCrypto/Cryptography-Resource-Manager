const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/permissions');

/* 
 * Looking at the error message and the userController exports, 
 * we need to comment out or implement routes that use undefined controller functions
 */

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
// Commenting out until implemented
// router.get('/', auth, isAdmin, userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
// Commenting out until implemented
// router.get('/:id', auth, isAdmin, userController.getUserById);

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

// @route   GET /api/users/me
// @desc    Get user profile
// @access  Private
router.get('/me', auth, userController.getUserProfile);

/*
// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private/Admin
// Commenting out until implemented
// router.put('/:id', auth, isAdmin, userController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
// Commenting out until implemented
// router.delete('/:id', auth, isAdmin, userController.deleteUser);

// @route   GET /api/users/:id/audit-logs
// @desc    Get user audit logs
// @access  Private/Admin
// Commenting out until implemented
// router.get('/:id/audit-logs', auth, isAdmin, userController.getUserAuditLogs);

// @route   PUT /api/users/profile/me
// @desc    Update current user profile
// @access  Private
// Commenting out until implemented
// router.put('/profile/me', auth, userController.updateCurrentUserProfile);

// @route   PUT /api/users/:id/permissions
// @desc    Update user permissions
// @access  Private/Admin
// Commenting out until implemented
// router.put('/:id/permissions', auth, isAdmin, userController.updateUserPermissions);
*/

module.exports = router;
