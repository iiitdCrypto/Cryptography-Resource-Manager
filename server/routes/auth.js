const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/db');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

// @route   PUT api/auth/password
// @desc    Update user password
// @access  Private
router.put('/users/password', auth, authController.updatePassword);

// @route   POST api/auth/register
// @desc    Register user with email OTP verification
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/verify-otp
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-otp', authController.verifyOTP);

// @route   POST api/auth/resend-otp
// @desc    Resend OTP verification code
// @access  Public
router.post('/resend-otp', authController.resendOTP);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, authController.getProfile);

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, authController.updateProfile);

module.exports = router;