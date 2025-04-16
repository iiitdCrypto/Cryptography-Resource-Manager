const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
router.post('/register', authController.register);

// @route   POST api/auth/verify-otp ✅ Correct endpoint
router.post('/verify-otp', authController.verifyOTP);

// @route   POST api/auth/resend-otp
router.post('/resend-otp', authController.resendOTP);

// @route   POST api/auth/login
router.post('/login', authController.login);

// @route   GET api/auth/profile
router.get('/profile', auth, authController.getProfile);

// @route   PUT api/auth/profile
router.put('/profile', auth, authController.updateProfile);

// @route   PUT api/auth/password ✅ Fixed path
router.put('/password', auth, authController.updatePassword);

module.exports = router;