const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/db');
const { attachPermissions } = require('./permissions');

// Verify JWT token middleware
const auth = async (req, res, next) => {
  // Skip auth check for dashboard routes
  if (req.path.startsWith('/api/admin/stats') || 
      req.path.startsWith('/api/resources') ||
      req.path.startsWith('/api/admin/users')) {
    return next();
  }

  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database with permissions
    const user = await executeQuery('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    
    if (user.length === 0) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    // Update last login time
    await executeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [decoded.id]
    );
    
    // Add user info to request
    req.user = user[0];
    
    // Attach user permissions
    await attachPermissions(req, res, next);
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;