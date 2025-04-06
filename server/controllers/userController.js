const { executeQuery, beginTransaction, commitTransaction, rollbackTransaction } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { sendOTPEmail } = require('../utils/emailService');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otpService');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, surname, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  try {
    // Check if user already exists
    const existingUsers = await executeQuery(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Begin transaction
    let connection;
    try {
      connection = await beginTransaction();

      // Create user
      const newUserResult = await executeQuery(
        `INSERT INTO users (name, surname, email, password, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [name, surname, email, hashedPassword]
      );

      const userId = newUserResult.insertId;

      // Create user settings
      await executeQuery(
        `INSERT INTO user_settings (user_id, created_at) 
         VALUES (?, NOW())`,
        [userId]
      );

      // Create user permissions
      await executeQuery(
        `INSERT INTO user_permissions (user_id, created_at) 
         VALUES (?, NOW())`,
        [userId]
      );

      // Generate OTP
      const otp = generateOTP(6);
      
      // Store OTP
      await storeOTP(email, otp);

      // Log user creation in audit
      await executeQuery(
        `INSERT INTO audit_logs (
          user_id, action_type, entity_type, entity_id, new_value, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          'CREATE',
          'USER',
          userId,
          JSON.stringify({ name, email, role: 'user' })
        ]
      );

      // Commit transaction
      if (connection) {
        await commitTransaction(connection);
      }

      // Send OTP email
      await sendOTPEmail(email, otp, name);

      res.status(201).json({
        message: 'User registered successfully. Please verify your email with the OTP sent.',
        userId,
        email
      });
    } catch (error) {
      // Rollback on error
      if (connection) {
        await rollbackTransaction(connection);
      }
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Registration failed');
  }
});

// @desc    Verify OTP and activate user account
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTPAndActivateAccount = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and OTP');
  }

  try {
    // Verify OTP
    const isValid = await verifyOTP(email, otp);

    if (!isValid) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    // Get user
    const users = await executeQuery(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = users[0];

    // If user is already verified
    if (user.email_verified) {
      return res.json({
        message: 'Email already verified',
        token: generateToken(user.id)
      });
    }

    // Update user to verified
    await executeQuery(
      'UPDATE users SET email_verified = TRUE WHERE id = ?',
      [user.id]
    );

    // Log verification in audit
    await executeQuery(
      `INSERT INTO audit_logs (
        user_id, action_type, entity_type, entity_id, old_value, new_value, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.id,
        'UPDATE',
        'USER',
        user.id,
        JSON.stringify({ email_verified: false }),
        JSON.stringify({ email_verified: true })
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

    // Return user data and token
    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      permissions: permissions[0] || {},
      settings: settings[0] || {},
      token
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
// @route   POST /api/users/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide email');
  }

  try {
    // Check if user exists
    const users = await executeQuery(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = users[0];

    // If user is already verified
    if (user.email_verified) {
      return res.status(400).json({
        message: 'Email is already verified'
      });
    }

    // Generate OTP
    const otp = generateOTP(6);
    
    // Store OTP
    await storeOTP(email, otp);

    // Send OTP email
    await sendOTPEmail(email, otp, user.name);

    res.json({
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Failed to resend OTP');
  }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
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
      `INSERT INTO audit_logs (
        user_id, action_type, entity_type, entity_id, created_at
      ) VALUES (?, ?, ?, ?, NOW())`,
      [
        user.id,
        'LOGIN',
        'USER',
        user.id
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
      settings: settings[0] || {},
      token
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
    await executeQuery(
      `INSERT INTO audit_logs (
        user_id, action_type, entity_type, entity_id, old_value, new_value, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId || null,
        'LOGIN',
        'USER',
        userId || 0,
        JSON.stringify({ success: false, email, reason }),
        null
      ]
    );
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  try {
    // Get user
    const users = await executeQuery(
      `SELECT id, name, surname, email, role, institution, position, 
       profile_image, bio, email_verified, last_login, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    // Get user permissions
    const permissions = await executeQuery(
      'SELECT * FROM user_permissions WHERE user_id = ?',
      [req.user.id]
    );

    // Get user settings
    const settings = await executeQuery(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    // Return user data
    res.json({
      ...users[0],
      permissions: permissions[0] || {},
      settings: settings[0] || {}
    });
  } catch (error) {
    console.error('Get user profile error:', error.message);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(error.message || 'Failed to get user profile');
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = {
  registerUser,
  loginUser,
  verifyOTPAndActivateAccount,
  resendOTP,
  getUserProfile
};