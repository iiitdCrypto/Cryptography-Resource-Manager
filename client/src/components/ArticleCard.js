import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaExternalLinkAlt } from 'react-icons/fa';
import Loader from './Loader';

const ArticleCard = ({ article, isNewlyLoaded = false }) => {
  const {
    title,
    description,
    url,
    imageUrl,
    source,
    publishedAt,
    category,
    type
  } = article;
  
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(isNewlyLoaded);
  
  // Add a slight delay to show the loading effect even for cached images
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     // Keep loading state for at least 500ms for a better visual effect
  //     if (!imageError) {
  //       const img = new Image();
  //       img.src = imageUrl;
  //       img.onload = () => setImageLoading(false);
  //       img.onerror = () => {
  //         setImageError(true);
  //         setImageLoading(false);
  //       };
  //     }
  //   }, 300);
    
  //   return () => clearTimeout(timer);
  // }, [imageUrl, imageError]);
  
  // Add a loading effect for newly loaded articles after scrolling
  useEffect(() => {
    if (isNewlyLoaded) {
      const timer = setTimeout(() => {
        setContentLoading(false);
      }, Math.random() * 250 + 500); // Random time between 500-750ms
      
      return () => clearTimeout(timer);
    }
  }, [isNewlyLoaded]);
  
  // Simple date formatter function
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  const formattedDate = formatDate(publishedAt);
  
  // Category colors
  const getCategoryColor = (cat) => {
    const colors = {
      cryptography: '#6c5ce7',
      cryptanalysis: '#e17055',
      blockchain: '#00b894',
      security: '#fdcb6e',
      encryption: '#0984e3',
      algorithms: '#6c5ce7'
    };
    
    return colors[cat] || '#6c5ce7';
  };
  
  const categoryColor = getCategoryColor(category);
  
  if (contentLoading) {
    return (
      <CardContainer as="div">
        <LoaderWrapper>
          <Loader />
        </LoaderWrapper>
      </CardContainer>
    );
  }
  
  return (
    <CardContainer href={url} target="_blank" rel="noopener noreferrer">
      {/* <CardImageContainer>
        {imageLoading ? (
          <ImageLoader>
            <LoaderPulse />
          </ImageLoader>
        ) : (
          <CardImage 
            src={imageError ? '/images/article-placeholder.jpg' : imageUrl} 
            alt={title}
            onError={() => setImageError(true)}
          />
        )}
        <TypeBadge type={type}>{type}</TypeBadge>
      </CardImageContainer> */}
      
      <CardContent>
        <CategoryTag style={{ color: categoryColor }}>
          <CategoryIcon style={{ color: categoryColor }}>◆</CategoryIcon>
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </CategoryTag>
        
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        
        <CardFooter>
          <CardDate>{formattedDate}</CardDate>
          <CardSource>{source}</CardSource>
        </CardFooter>
        
        <ReadMoreButton>
          Read Full Article
          <FaExternalLinkAlt size={12} style={{ marginLeft: '5px' }} />
        </ReadMoreButton>
      </CardContent>
    </CardContainer>
  );
};

// Animation keyframes
const pulse = keyframes`
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: -135% 0%;
  }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 300px;
`;

const ImageLoader = styled.div`
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

const LoaderPulse = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0);
  background-size: 400% 100%;
  animation: ${pulse} 1.2s ease-in-out infinite;
`;

const CardContainer = styled.a`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-decoration: none;
  color: inherit;
  height: 100%;
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }
`;

const CardImageContainer = styled.div`
  position: relative;
  height: 180px;
  overflow: hidden;
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const TypeBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: ${props => props.type === 'academic' ? '#6c5ce7' : '#00b894'};
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CardContent = styled.div`
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const CategoryTag = styled.div`
  display: inline-flex;
  align-items: center;
  margin-bottom: 0.8rem;
  font-size: 0.85rem;
  color: #6c5ce7;
  font-weight: 500;
`;

const CategoryIcon = styled.span`
  margin-right: 0.4rem;
  font-size: 0.7rem;
  color: #6c5ce7;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.4;
  
  /* Limit to 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  flex: 1;
  
  /* Limit to 3 lines */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-top: auto;
  margin-bottom: 1rem;
`;

const CardDate = styled.span`
  font-weight: 400;
`;

const CardSource = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textDark};
`;

const ReadMoreButton = styled.div`
  background-color: #6c5ce7;
  color: white;
  text-align: center;
  padding: 0.6rem;
  border-radius: 5px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #5649c0;
  }
`;

export default ArticleCard;