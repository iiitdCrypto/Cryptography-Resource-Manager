const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/articles/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Get all articles
router.get('/', async (req, res) => {
  try {
    const [articles] = await pool.query(`
      SELECT a.*, CONCAT(u.name, ' ', u.surname) as author_name 
      FROM articles a 
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.status(200).json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get article by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [articles] = await pool.query(`
      SELECT a.*, CONCAT(u.name, ' ', u.surname) as author_name 
      FROM articles a 
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `, [id]);
    
    if (articles.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.status(200).json(articles[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new article (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const authorId = req.user.id;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;
    }
    
    const [result] = await pool.query(
      'INSERT INTO articles (title, content, author_id, image_url) VALUES (?, ?, ?, ?)',
      [title, content, authorId, imageUrl]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Article added successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update article (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    let updateQuery = 'UPDATE articles SET title = ?, content = ?';
    let queryParams = [title, content];
    
    if (req.file) {
      updateQuery += ', image_url = ?';
      queryParams.push(req.file.path);
    }
    
    updateQuery += ' WHERE id = ?';
    queryParams.push(id);
    
    await pool.query(updateQuery, queryParams);
    
    res.status(200).json({ message: 'Article updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete article (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    await pool.query('DELETE FROM articles WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get articles from multiple sources
router.get('/', async (req, res) => {
  try {
    const { search = '', category = 'all', page = 1 } = req.query;
    const searchQuery = search || `cryptography ${category !== 'all' ? category : ''}`;
    
    // Combine results from multiple APIs
    const sources = [
      // News API
      axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: searchQuery,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 10,
          page: page,
          apiKey: process.env.NEWS_API_KEY
        }
      }).catch(err => ({ data: { articles: [] } })),
      
      // NewsData.io API
      axios.get(`https://newsdata.io/api/1/news`, {
        params: {
          apikey: process.env.NEWSDATA_API_KEY,
          q: searchQuery,
          language: 'en',
          page: page
        }
      }).catch(err => ({ data: { results: [] } }))
    ];
    
    // Execute all requests in parallel
    const results = await Promise.allSettled(sources);
    
    // Process and normalize the results
    let articles = [];
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const response = result.value;
        
        if (response.config && response.config.url.includes('newsapi.org')) {
          // Process News API results
          const newsArticles = response.data.articles.map(article => ({
            id: article.url,
            title: article.title,
            description: article.description || 'No description available',
            content: article.content,
            url: article.url,
            imageUrl: article.urlToImage,
            source: article.source.name,
            publishedAt: article.publishedAt,
            category: detectCategory(article.title + ' ' + (article.description || '')),
            type: 'news'
          }));
          articles = [...articles, ...newsArticles];
        } 
        else if (response.config && response.config.url.includes('newsdata.io')) {
          // Process NewsData.io results
          const newsDataArticles = (response.data.results || []).map(article => ({
            id: article.link,
            title: article.title,
            description: article.description || article.content || 'No description available',
            content: article.content,
            url: article.link,
            imageUrl: article.image_url,
            source: article.source_id,
            publishedAt: article.pubDate,
            category: detectCategory(article.title + ' ' + (article.description || '')),
            type: 'news'
          }));
          articles = [...articles, ...newsDataArticles];
        }
      }
    });
    
    // Filter out non-cryptography related articles
    articles = articles.filter(article => 
      isCryptographyRelated(article.title + ' ' + (article.description || ''))
    );
    
    // Sort by date (newest first)
    articles.sort((a, b) => 
      new Date(b.publishedAt || '2000-01-01') - new Date(a.publishedAt || '2000-01-01')
    );
    
    // Remove duplicates based on URL
    const uniqueArticles = [];
    const urlSet = new Set();
    
    articles.forEach(article => {
      if (!urlSet.has(article.url)) {
        urlSet.add(article.url);
        uniqueArticles.push(article);
      }
    });
    
    res.json(uniqueArticles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Function to detect the category of an article based on its content
function detectCategory(text) {
  text = text.toLowerCase();
  
  if (text.includes('blockchain') || text.includes('bitcoin') || text.includes('ethereum')) {
    return 'blockchain';
  } else if (text.includes('cryptanalysis') || text.includes('breaking') || text.includes('attack')) {
    return 'cryptanalysis';
  } else if (text.includes('security') || text.includes('protection') || text.includes('defense')) {
    return 'security';
  } else if (text.includes('encryption') || text.includes('cipher') || text.includes('encrypt')) {
    return 'encryption';
  } else if (text.includes('algorithm') || text.includes('protocol')) {
    return 'algorithms';
  } else {
    return 'cryptography';
  }
}

// Function to check if an article is related to cryptography
function isCryptographyRelated(text) {
  text = text.toLowerCase();
  const cryptoKeywords = [
    'cryptography', 'encryption', 'decryption', 'cipher', 'hash', 'blockchain',
    'security', 'privacy', 'key', 'algorithm', 'rsa', 'aes', 'des', 'sha',
    'digital signature', 'authentication', 'cryptanalysis', 'symmetric', 'asymmetric'
  ];
  
  return cryptoKeywords.some(keyword => text.includes(keyword));
}

module.exports = router;