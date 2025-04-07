import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Typography, Button } from '@mui/material';

const ArticleCard = ({ article, type }) => {
  if (type === 'news') {
    return (
      <Card className="article-card">
        <CardContent>
          <Typography variant="h6" component="h2">
            {article.title}
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            Source: {article.source}
          </Typography>
          <Typography variant="body2" component="p">
            {article.description}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginTop: '1rem' }}
          >
            Read More
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="article-card">
      <CardContent>
        <Typography variant="h6" component="h2">
          {article.title}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          By {article.author_name}
        </Typography>
        <Typography variant="body2" component="p">
          {article.content?.substring(0, 200)}...
        </Typography>
        <Link to={`/articles/${article.id}`}>
          <Button 
            variant="contained" 
            color="primary"
            style={{ marginTop: '1rem' }}
          >
            Read More
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;