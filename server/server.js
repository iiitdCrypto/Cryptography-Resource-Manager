const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { connectDB } = require('./config/db');
const initializeDatabase = require('./config/initDb');
const { attachPermissions } = require('./middleware/permissions');

const app = express();

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

// Enable CORS for all routes
app.use(cors());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    await connectDB();
    await initializeDatabase();
    console.log('Database setup complete');
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

const PORT = process.env.PORT || 5001;

// Function to find an available port
const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying port ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

// Start the server
connectDB()
  .then(() => {
    startServer(PORT);
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });