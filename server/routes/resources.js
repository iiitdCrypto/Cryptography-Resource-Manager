const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resources/');
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
    const [resources] = await pool.query(`
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
    const [resources] = await pool.query(`
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
    const { title, description, type, url } = req.body;
    const userId = req.user.id;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    let filePath = null;
    if (req.file) {
      filePath = req.file.path;
    }
    
    const [result] = await pool.query(
      'INSERT INTO resources (title, description, type, url, file_path, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, type, url, filePath, userId]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Resource added successfully' 
    });
  } catch (error) {
    console.error(error);
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
    
    await pool.query(updateQuery, queryParams);
    
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
    
    await pool.query('DELETE FROM resources WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;