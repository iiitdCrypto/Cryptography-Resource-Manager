const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getPool } = require('../config/db');  // Update this line
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const xml2js = require('xml2js');  // Updated import
require('dotenv').config();

const SITEMAP_URL = 'https://thehackernews.com/news-sitemap.xml';

const CATEGORIES = {
  cryptography: ['cryptography', 'encryption', 'cipher', 'cryptosystem', 'key exchange'],
  cryptanalysis: ['cryptanalysis', 'attack', 'vulnerability', 'break', 'crack', 'weakness'],
  security: ['cybersecurity', 'security', 'protection', 'defense', 'threat', 'privacy'],
  blockchain: ['blockchain', 'bitcoin', 'cryptocurrency', 'ethereum', 'smart contract']
};

// Get articles from multiple sources
router.get('/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { category = 'all', search = '' } = req.query;

    console.log('Fetching articles with params:', { page, pageSize, category, search });

    // Fetch and filter news articles from The Hacker News
    const newsArticles = await fetchHackerNewsArticles(category, page, pageSize);
    console.log('News articles fetched:', newsArticles);
    
    // Fetch and filter academic articles
    const academicArticles = await fetchAcademicArticles(search, category, page, pageSize);
    console.log('Academic articles fetched:', academicArticles);

    if (!newsArticles.items.length && !academicArticles.items.length) {
      console.log('No articles found');
    }

    res.json({
      success: true,
      articles: {
        academic: academicArticles,
        news: newsArticles
      }
    });
  } catch (error) {
    console.error('Detailed error in /all route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching articles',
      error: error.toString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

async function fetchHackerNewsArticles(category, page, pageSize) {
  try {
    // Define crypto keywords for filtering
    const CRYPTO_KEYWORDS = [
      'cryptography',
      'encryption',
      'crypto',
      'cipher',
      'cryptanalysis',
      'quantum cryptography',
      'blockchain',
      'cryptocurrency',
      'cybersecurity'
    ];
    
    // Fetch sitemap with detailed error logging
    console.log('Fetching sitemap from:', SITEMAP_URL);
    const response = await axios.get(SITEMAP_URL, {
      headers: {
        'User-Agent': 'Cryptography-Resource-Manager/1.0',
        'Accept': 'application/xml, text/xml, */*'
      },
      timeout: 15000 // 15 second timeout
    });
    
    console.log('Sitemap response received, parsing XML...');
    const parser = new xml2js.Parser();
    
    // Use promise to handle XML parsing
    return new Promise((resolve, reject) => {
      parser.parseString(response.data, (err, result) => {
        if (err) {
          console.error('Error parsing XML:', err);
          return resolve({ items: [], total: 0, page, pageSize, hasMore: false });
        }
        
        if (!result.urlset || !result.urlset.url) {
          console.error('Invalid sitemap structure');
          return resolve({ items: [], total: 0, page, pageSize, hasMore: false });
        }
        
        try {
          // Map the XML data to article objects
          const articles = result.urlset.url.map(url => ({
            title: url['news:news'][0]['news:title'][0],
            link: url.loc[0],
            pubDate: new Date(url['news:news'][0]['news:publication_date'][0]),
            source: 'The Hacker News',
            keywords: url['news:news'][0]['news:keywords'] ? 
                     url['news:news'][0]['news:keywords'][0].split(',') : []
          }));
          
          // Filter crypto-related articles
          const cryptoArticles = articles.filter(article => {
            const text = `${article.title} ${article.keywords.join(' ')}`.toLowerCase();
            return CRYPTO_KEYWORDS.some(keyword => text.includes(keyword));
          });
          
          console.log(`Found ${cryptoArticles.length} crypto-related articles`);
          
          // Format the articles to match the application's expected structure
          let formattedArticles = cryptoArticles.map((article, index) => ({
            id: `news-${index}`,
            title: article.title,
            type: 'news',
            description: article.keywords.join(', '),
            publishedAt: article.pubDate.toISOString(),
            url: article.link,
            source: article.source,
            content: article.keywords.join(', '),
            category: detectCategory(article.title + ' ' + article.keywords.join(' '))
          }));
          
          // Filter by category if specified
          if (category !== 'all') {
            formattedArticles = formattedArticles.filter(article => article.category === category);
            console.log(`Filtered to ${formattedArticles.length} articles in category: ${category}`);
          }
          
          // Sort by publication date (newest first)
          formattedArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
          
          // Paginate results
          const startIndex = (page - 1) * pageSize;
          const paginatedArticles = formattedArticles.slice(startIndex, startIndex + pageSize);
          
          resolve({
            items: paginatedArticles,
            total: formattedArticles.length,
            page,
            pageSize,
            hasMore: startIndex + pageSize < formattedArticles.length
          });
        } catch (error) {
          console.error('Error processing articles:', error);
          resolve({ items: [], total: 0, page, pageSize, hasMore: false });
        }
      });
    });
  } catch (error) {
    console.error('Hacker News Sitemap Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', JSON.stringify(error.response.headers));
    }
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }
}

async function fetchAcademicArticles(search, category, page, pageSize) {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database connection not initialized');
  }

  const offset = (page - 1) * pageSize;
  // Modified to use only name field instead of concatenating with surname
  const query = `
    SELECT a.*, u.name as author_name 
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
    const pool = getPool();
    if (!pool) {
      throw new Error('Database connection not initialized');
    }
    const [articles] = await pool.query(`
      SELECT a.*, u.name as author_name 
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
    const pool = getPool();
    if (!pool) {
      throw new Error('Database connection not initialized');
    }
    const { id } = req.params;
    const [articles] = await pool.query(`
      SELECT a.*, u.name as author_name 
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
    const pool = getPool();
    if (!pool) {
      throw new Error('Database connection not initialized');
    }
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
    const pool = getPool();
    if (!pool) {
      throw new Error('Database connection not initialized');
    }
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
    const pool = getPool();
    if (!pool) {
      throw new Error('Database connection not initialized');
    }
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
});  // Add missing closing parenthesis here

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