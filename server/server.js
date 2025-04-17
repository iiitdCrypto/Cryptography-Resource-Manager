const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./config/db');
const initializeDatabase = require('./config/initDb');
const { attachPermissions } = require('./middleware/permissions');
const checkDbConnection = require('./config/checkDbConnection');

const app = express();

// Trust proxy - fix for express-rate-limit
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5001', process.env.CLIENT_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Origin', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach user permissions to all authorized requests
app.use((req, res, next) => {
  // Only run permissions middleware when the request has user data
  if (req.user) {
    return attachPermissions(req, res, next);
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Root route
app.get('/', (req, res) => {
  res.send('Cryptography Resource Manager API');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Initialize database connection and tables
(async () => {
  try {
    console.log('Starting server initialization...');
    
    // Check database connection first
    const dbConnected = await checkDbConnection();
    if (!dbConnected) {
      console.error('Database connection check failed. Proceeding with caution...');
    }
    
    // Initialize database only if connection check passed
    if (dbConnected) {
      await connectDB();
      await initializeDatabase();
      console.log('Database setup complete');
    } else {
      console.warn('⚠️ Database initialization skipped due to connection issues.');
      console.warn('⚠️ API endpoints that require database access will not work.');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    // Don't exit process in development to allow for retries
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

console.log('Registering /api/articles route');
app.use('/api/articles', require('./routes/articles'));

// Register Hacker News articles route
console.log('Registering /api/news route');
app.use('/api/news', require('./routes/hackerNewsArticles'));

// Register IACR News route
console.log('Registering /api/iacr-news route');
app.use('/', require('./routes/iacrNews'));

app.use('/api/resources', require('./routes/resources'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/events', require('./routes/events'));
app.use('/api/lectures', require('./routes/lectures'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/professors', require('./routes/professors'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Initialize server
const PORT = process.env.PORT || 5001;

// Start server with better error handling
async function startServer() {
  console.log('Starting server...');
  
  try {
    // Connect to database
    const pool = await connectDB();
    console.log('Database connection established');
    
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    console.log('Server will continue to run but some features may not work properly');
    
    // Start server anyway to allow mock endpoints to work
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT} (without database connection)`);
    });
  }
}

startServer();