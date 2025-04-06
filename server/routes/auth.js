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
router.post('/verify-otp', authController.verifyEmailWithOTP);

// @route   POST api/auth/resend-otp
// @desc    Resend OTP for email verification
// @access  Public
router.post('/resend-otp', authController.resendVerificationOTP);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

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

module.exports = router;