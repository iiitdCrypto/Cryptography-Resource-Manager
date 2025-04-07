const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool, executeQuery } = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

const CATEGORIES = {
  cryptography: ['cryptography', 'encryption', 'cipher', 'cryptosystem', 'key exchange'],
  cryptanalysis: ['cryptanalysis', 'attack', 'vulnerability', 'break', 'crack', 'weakness'],
  security: ['cybersecurity', 'security', 'protection', 'defense', 'threat', 'privacy'],
  blockchain: ['blockchain', 'bitcoin', 'cryptocurrency', 'ethereum', 'smart contract']
};

// Get articles from multiple sources (THIS MUST BE FIRST)
router.get('/all', async (req, res) => {
  console.log('Hit /api/articles/all route');
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { category = 'all', search = '' } = req.query;

    console.log('Fetching articles:', { page, pageSize, category, search });

    // NewsAPI query based on category
    const newsApiQuery = category === 'all' 
      ? 'cryptography OR encryption OR blockchain OR cybersecurity OR cryptanalysis'
      : CATEGORIES[category].join(' OR ');

    // Fetch and filter news articles
    const newsArticles = await fetchNewsArticles(newsApiQuery, page, pageSize, category);
    
    // Fetch and filter academic articles
    const academicArticles = await fetchAcademicArticles(search, category, page, pageSize);

    res.json({
      success: true,
      articles: {
        academic: academicArticles,
        news: newsArticles
      }
    });
  } catch (error) {
    console.error('Error in /all route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching articles',
      error: error.message 
    });
  }
});

async function fetchNewsArticles(query, page, pageSize, category) {
  try {
    const response = await axios.get(NEWS_API_URL, {
      params: {
        apiKey: NEWS_API_KEY,
        q: query,
        pageSize: pageSize * 2, // Fetch more to account for filtering
        page: page,
        language: 'en',
        sortBy: 'publishedAt'
      }
    });

    let articles = response.data.articles.map((article, index) => ({
      id: `news-${page}-${index}`,
      title: article.title,
      type: 'news',
      description: article.description,
      publishedAt: article.publishedAt,
      url: article.url,
      source: article.source.name,
      urlToImage: article.urlToImage,
      category: detectCategory(article.title + ' ' + (article.description || ''))
    }));

    // Filter by category if specified
    if (category !== 'all') {
      articles = articles.filter(article => article.category === category);
    }

    return {
      items: articles.slice(0, pageSize),
      total: response.data.totalResults,
      page,
      pageSize,
      hasMore: articles.length > pageSize
    };
  } catch (error) {
    console.error('NewsAPI Error:', error);
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }
}

async function fetchAcademicArticles(search, category, page, pageSize) {
  const offset = (page - 1) * pageSize;
  const query = `
    SELECT a.*, CONCAT(u.name, ' ', u.surname) as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id
    WHERE (a.title LIKE ? OR a.content LIKE ?)
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [articles] = await pool.query(query, 
    [`%${search}%`, `%${search}%`, pageSize, offset]
  );

  const filtered = articles.map(article => ({
    ...article,
    category: detectCategory(article.title + ' ' + article.content)
  })).filter(article => 
    category === 'all' || article.category === category
  );

  const [total] = await pool.query('SELECT COUNT(*) as count FROM articles');

  return {
    items: filtered,
    total: total[0].count,
    page,
    pageSize,
    hasMore: offset + filtered.length < total[0].count
  };
}

function detectCategory(text) {
  text = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'cryptography'; // Default category
}

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

// Function to detect the category of an article based on its content
function detectCategory(text) {
  text = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'cryptography'; // Default category
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