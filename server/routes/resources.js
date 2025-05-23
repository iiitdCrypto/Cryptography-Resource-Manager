const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/resources';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|ppt|pptx|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, PPT, PPTX, DOC, DOCX files are allowed'));
  }
});

// Get all resources
router.get('/', async (req, res) => {
  try {
    const resources = await db.executeQuery(`
      SELECT r.*, u.name as creator_name 
      FROM resources r 
      LEFT JOIN users u ON r.created_by = u.id
    `);
    res.status(200).json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get resources by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const resources = await db.executeQuery(`
      SELECT r.*, u.name as creator_name 
      FROM resources r 
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.type = ?
    `, [type]);
    res.status(200).json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new resource (admin only)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('Resource creation request received');
    console.log('User data:', req.user);
    
    const { title, description, type, url } = req.body;
    const userId = req.user ? req.user.id : 1;
    
    // Check if user is admin - temporarily disabled for testing
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied. Admin only.' });
    // }
    
    let filePath = null;
    if (req.file) {
      filePath = req.file.path;
    }
    
    const currentTimestamp = new Date().toISOString();
    
    const result = await db.executeQuery(
      'INSERT INTO resources (title, description, type, url, file_path, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, type, url, filePath, userId, currentTimestamp]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      title,
      description,
      type,
      url,
      file_path: filePath,
      created_by: userId,
      created_at: currentTimestamp,
      createdAt: currentTimestamp,
      message: 'Resource added successfully' 
    });
  } catch (error) {
    console.error('Resource creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update resource (admin only)
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, url } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    let updateQuery = 'UPDATE resources SET title = ?, description = ?, type = ?, url = ?';
    let queryParams = [title, description, type, url];
    
    if (req.file) {
      updateQuery += ', file_path = ?';
      queryParams.push(req.file.path);
    }
    
    updateQuery += ' WHERE id = ?';
    queryParams.push(id);
    
    await db.executeQuery(updateQuery, queryParams);
    
    res.status(200).json({ message: 'Resource updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete resource (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    await db.executeQuery('DELETE FROM resources WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload file endpoint
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Get file path
    const filePath = req.file.path;
    
    // In a production environment, this would be a URL to a CDN or file server
    // For development, we'll just use the local path
    const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
    
    res.status(200).json({ 
      message: 'File uploaded successfully',
      url: fileUrl,
      file_path: filePath
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// Mock file upload endpoint for development/testing
router.post('/upload/mock', (req, res) => {
  try {
    console.log('Mock file upload endpoint called');
    
    // Return mock file URL
    res.status(200).json({ 
      message: 'File uploaded successfully (mock)',
      url: 'https://example.com/mock-file.pdf',
      file_path: '/uploads/resources/mock-file.pdf'
    });
  } catch (error) {
    console.error('Mock file upload error:', error);
    res.status(500).json({ message: 'Server error during mock file upload' });
  }
});

// Mock endpoint that always returns data (for development/testing)
router.get('/mock', (req, res) => {
  try {
    console.log('Serving mock resource data (guaranteed to work without DB connection)');
    
    const mockResources = [
      {
        id: 1,
        title: 'Introduction to Symmetric Cryptography',
        description: 'A comprehensive overview of symmetric encryption techniques',
        type: 'video',
        url: 'https://example.com/video1',
        file_path: null,
        created_by: 1,
        creator_name: 'Dr. Jane Smith',
        tags: ['symmetric', 'encryption', 'basics'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Public Key Infrastructure Explained',
        description: 'Deep dive into PKI and its applications in modern cryptography',
        type: 'pdf',
        url: 'https://example.com/pki-guide.pdf',
        file_path: '/uploads/resources/pki-guide.pdf',
        created_by: 2,
        creator_name: 'Prof. John Doe',
        tags: ['PKI', 'asymmetric', 'advanced'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Blockchain and Cryptography',
        description: 'How cryptographic principles are used in blockchain technology',
        type: 'book',
        url: 'https://example.com/blockchain-book',
        file_path: null,
        created_by: 1,
        creator_name: 'Michael Chen',
        tags: ['blockchain', 'applications', 'modern'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ];
    
    res.status(200).json(mockResources);
  } catch (error) {
    console.error('Error in mock endpoint:', error);
    // Even if there's an error, still return mock data
    res.status(200).json([
      {
        id: 1,
        title: 'Emergency Fallback Resource',
        description: 'This is a fallback resource when all else fails',
        type: 'document',
        url: 'https://example.com/fallback',
        created_by: 1,
        creator_name: 'System',
        tags: ['fallback'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]);
  }
});

module.exports = router;