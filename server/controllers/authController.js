const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { generateOTP, storeOTP, verifyOTP, cleanupExpiredOTPs } = require('../utils/otpService');

// @desc    Register a new user with OTP verification
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  if (!first_name || !email || !password) {
    res.status(400);
    throw new Error('First name, email, and password are required');
  }

  // Check if email already exists
  const existingUser = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);

  if (existingUser.length > 0) {
    res.status(400);
    throw new Error('Email is already registered');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    // Start transaction
    await executeQuery('START TRANSACTION');

    // Insert user with email_verified = false
    const result = await executeQuery(
      `INSERT INTO users (
        first_name, last_name, email, password, role, 
        email_verified, account_status, last_password_change, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [
        first_name,
        last_name || null,
        email,
        hashedPassword,
        'regular',
        false, // Not verified yet
        'inactive' // Inactive until email is verified
      ]
    );
    
    const userId = result.insertId;

    // Add default user settings
    await executeQuery(
      `INSERT INTO user_settings (
        user_id, theme, language, email_notifications, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [userId, 'system', 'en', true]
    );

    // Add default user permissions
    await executeQuery(
      `INSERT INTO user_permissions (
        user_id, can_access_dashboard, can_update_content, can_manage_users, 
        can_view_analytics, can_create_events, can_edit_events, can_delete_events,
        can_create_resources, can_edit_resources, can_delete_resources,
        can_view_audit_logs, can_manage_permissions, can_export_data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId, false, false, false, false, false, false, false, 
        false, false, false, false, false, false
      ]
    );

    // Generate OTP
    const otp = generateOTP(6);
    
    // Store OTP in database
    await storeOTP(email, otp);
    
    // Send verification email with OTP
    await sendOTPEmail(email, otp, first_name);

    // Create audit log entry
    await executeQuery(
      `INSERT INTO activity_logs (
        user_id, action, resource_type, resource_id, description, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        'CREATE',
        'USER',
        userId,
        'User registered, awaiting email verification'
      ]
    );

    // Commit transaction
    await executeQuery('COMMIT');

    // Return user data (without token since not yet verified)
    res.status(201).json({
      id: userId,
      first_name,
      email,
      message: 'Registration successful. Please check your email for verification code.',
      // Include OTP in development mode only
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    await executeQuery('ROLLBACK');
    console.error('Registration error:', error.message);
    res.status(500);
    throw new Error('User registration failed: ' + error.message);
  }
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyEmailWithOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  try {
    // Verify OTP
    const isValid = await verifyOTP(email, otp);

    if (!isValid) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    // Get user
    const user = await executeQuery(
      'SELECT id, name FROM users WHERE email = ?',
      [email]
    );

    if (user.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const userId = user[0].id;

    // Activate user account
    await executeQuery(
      'UPDATE users SET email_verified = TRUE, account_status = "active" WHERE id = ?',
      [userId]
    );

    // Create audit log entry
    await executeQuery(
      `INSERT INTO activity_logs (
        user_id, action, resource_type, resource_id, description, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        'UPDATE',
        'USER',
        userId,
        'Email verified via OTP'
      ]
    );

    // Generate token for automatic login
    const token = generateToken(userId);

    res.json({
      success: true,
      message: 'Email verified successfully. Your account is now active.',
      token,
      user: {
        id: userId,
        name: user[0].name,
        email
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'OTP verification failed');
  }
});

// @desc    Resend OTP for email verification
// @route   POST /api/auth/resend-otp
// @access  Public
const resendVerificationOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  try {
    // Check if user exists
    const user = await executeQuery(
      'SELECT id, name, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (user.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check if already verified
    if (user[0].email_verified) {
      res.status(400);
      throw new Error('Email is already verified');
    }

    // Generate new OTP
    const otp = generateOTP(6);
    
    // Store OTP in database
    await storeOTP(email, otp);
    
    // Send verification email with OTP
    await sendOTPEmail(email, otp, user[0].name);

    // Log activity
    await executeQuery(
      `INSERT INTO activity_logs (
        user_id, action, resource_type, resource_id, description, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        user[0].id,
        'UPDATE',
        'USER',
        user[0].id,
        'Verification OTP resent'
      ]
    );

    res.json({
      success: true,
      message: 'Verification code resent. Please check your email.',
      // Include OTP in development mode only
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Failed to resend verification code');
  }
});

// @desc    Login user and get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Get user
    const users = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      await logFailedLogin(null, email, ipAddress, userAgent, 'Invalid email');
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Check if email is verified
    if (!user.email_verified) {
      await logFailedLogin(user.id, email, ipAddress, userAgent, 'Email not verified');
      res.status(401);
      throw new Error('Please verify your email before logging in');
    }

    // Check if account is suspended
    if (user.account_status === 'suspended') {
      await logFailedLogin(user.id, email, ipAddress, userAgent, 'Account suspended');
      res.status(401);
      throw new Error('Your account has been suspended. Please contact an administrator.');
    }

    // Check if account is inactive
    if (user.account_status === 'inactive') {
      await logFailedLogin(user.id, email, ipAddress, userAgent, 'Account inactive');
      res.status(401);
      throw new Error('Your account is inactive. Please contact an administrator.');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment login attempts
      await executeQuery(
        'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?',
        [user.id]
      );

      // If too many failed attempts, suspend account
      if (user.login_attempts >= 4) { // This makes 5 total with the current one
        await executeQuery(
          'UPDATE users SET account_status = ? WHERE id = ?',
          ['suspended', user.id]
        );
      }

      await logFailedLogin(user.id, email, ipAddress, userAgent, 'Invalid password');
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Reset login attempts and update last login
    await executeQuery(
      'UPDATE users SET login_attempts = 0, last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Log successful login
    await executeQuery(
      `INSERT INTO activity_logs (
        user_id, action, resource_type, resource_id, description, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id,
        'LOGIN',
        'USER',
        user.id,
        'User logged in',
        ipAddress,
        userAgent
      ]
    );

    // Get user permissions
    const permissions = await executeQuery(
      'SELECT * FROM user_permissions WHERE user_id = ?',
      [user.id]
    );

    // Get user settings
    const settings = await executeQuery(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id);

    // Return user data
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        institution: user.institution,
        position: user.position,
        profile_image: user.profile_image,
        bio: user.bio,
        email_verified: user.email_verified,
        last_login: user.last_login,
        permissions: permissions[0] || {},
        settings: settings[0] || {}
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Login failed');
  }
});

// Helper to log failed login attempts
const logFailedLogin = async (userId, email, ipAddress, userAgent, reason) => {
  try {
    // Handle null user_id case with a different query structure
    if (userId === null) {
      await executeQuery(
        `INSERT INTO activity_logs (
          action, resource_type, resource_id, description, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          'LOGIN_FAILED',
          'USER',
          0,
          `Failed login attempt for ${email}: ${reason}`,
          ipAddress,
          userAgent
        ]
      );
    } else {
      await executeQuery(
        `INSERT INTO activity_logs (
          user_id, action, resource_type, resource_id, description, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          'LOGIN_FAILED',
          'USER',
          userId,
          `Failed login attempt: ${reason}`,
          ipAddress,
          userAgent
        ]
      );
    }
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
};

// @desc    Request password reset (with OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  try {
    // Check if user exists
    const user = await executeQuery(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );

    if (user.length === 0) {
      // Don't reveal if email exists or not for security
      res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset code'
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP(6);
    
    // Store OTP in database (use shorter expiration for password reset)
    await storeOTP(email, otp, 15); // 15 minutes expiration
    
    // Send password reset email with OTP
    const resetInfo = {
      to: email,
      subject: 'Password Reset Request',
      text: `Your password reset code is: ${otp}. This code will expire in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
          <h2>Password Reset</h2>
          <p>Your password reset code is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `
    };
    
    await sendOTPEmail(email, otp, user[0].name);

    // Log activity
    await executeQuery(
      `INSERT INTO activity_logs (
        user_id, action, resource_type, resource_id, description, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        user[0].id,
        'PASSWORD_RESET_REQUEST',
        'USER',
        user[0].id,
        'Password reset requested'
      ]
    );

    res.json({
      success: true,
      message: 'Password reset email sent',
      // Include OTP in development mode only
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500);
    throw new Error('Failed to process password reset request');
  }
});

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    res.status(400);
    throw new Error('Email, OTP, and new password are required');
  }

  try {
    // Verify OTP
    const isValid = await verifyOTP(email, otp);

    if (!isValid) {
      res.status(400);
      throw new Error('Invalid or expired reset code');
    }

    // Get user
    const user = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (user.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const userId = user[0].id;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    await executeQuery(
      'UPDATE users SET password = ?, last_password_change = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    // Log activity
    await executeQuery(
      `INSERT INTO activity_logs (
        user_id, action, resource_type, resource_id, description, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        'PASSWORD_RESET',
        'USER',
        userId,
        'Password reset completed'
      ]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Failed to reset password');
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Run cleanup of expired OTPs periodically
setInterval(async () => {
  try {
    const deleted = await cleanupExpiredOTPs();
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired OTPs`);
    }
  } catch (error) {
    console.error('OTP cleanup failed:', error);
  }
}, 15 * 60 * 1000); // Run every 15 minutes

module.exports = {
  register,
  verifyEmailWithOTP,
  resendVerificationOTP,
  login,
  forgotPassword,
  resetPassword
};