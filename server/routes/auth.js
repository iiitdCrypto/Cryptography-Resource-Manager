const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register user with email OTP verification
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/verify-otp
// @desc    Verify email with OTP
// @access  Public
<<<<<<< HEAD
router.post('/verify-otp', authController.verifyEmail);

// @route   POST api/auth/resend-otp
// @desc    Resend OTP verification code
// @access  Public
router.post('/resend-otp', authController.resendOTP);
=======
router.post('/verify-otp', authController.verifyEmailWithOTP);

// @route   POST api/auth/resend-otp
// @desc    Resend OTP for email verification
// @access  Public
router.post('/resend-otp', authController.resendVerificationOTP);
>>>>>>> 82939576ee37b12dba67578adf111e420d0654ac

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

<<<<<<< HEAD
// @route   GET api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, authController.getProfile);

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, authController.updateProfile);
=======
// @route   POST api/auth/forgot-password
// @desc    Request password reset (with OTP)
// @access  Public
router.post('/forgot-password', authController.forgotPassword);

// @route   POST api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', authController.resetPassword);

// @route   GET api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', auth, (req, res) => {
  res.json(req.user);
});
>>>>>>> 82939576ee37b12dba67578adf111e420d0654ac

module.exports = router;