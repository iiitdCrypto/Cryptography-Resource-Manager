import React, { useEffect, useState } from 'react';
import axios from 'axios';

const IACRNews = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/iacr-news')
      .then(res => setNews(res.data))
      .catch(err => console.error("Error fetching news", err));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Latest IACR News</h2>
      <ul className="list-disc pl-6">
        {news.map((item, index) => (
          <li key={index} className="mb-2">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IACRNews;
