const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 3001;

app.get('/api/iacr-news', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.iacr.org/news/');
    const $ = cheerio.load(data);
    const newsItems = [];

    $('ul.news li').each((_, el) => {
      const title = $(el).text().trim();
      const relativeLink = $(el).find('a').attr('href');
      const link = relativeLink ? `https://www.iacr.org${relativeLink}` : null;
      newsItems.push({ title, link });
    });

    res.json(newsItems);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
