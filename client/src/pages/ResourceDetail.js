import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { FaArrowLeft, FaVideo, FaFileAlt, FaBook, FaQuoteLeft, FaExternalLinkAlt, FaDownload, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const ResourceDetail = () => {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const { id } = useParams();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://0.0.0.0:5001/api/resources/${id}`);
        setResource(response.data);
        
        // Check if resource is bookmarked by the user
        if (user) {
          const bookmarksResponse = await axios.get('http://0.0.0.0:5001/api/bookmarks', {
            headers: {
              'x-auth-token': localStorage.getItem('token')
            }
          });
          
          const isBookmarked = bookmarksResponse.data.some(
            bookmark => bookmark.resourceId === id
          );
          
          setIsBookmarked(isBookmarked);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch resource details');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchResource();
  }, [id, user]);
  
  const handleBookmark = async () => {
    if (!user) return;
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        await axios.delete(`http://0.0.0.0:5001/api/bookmarks/${id}`, {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
      } else {
        // Add bookmark
        await axios.post('http://0.0.0.0:5001/api/bookmarks', 
          { resourceId: id },
          {
            headers: {
              'x-auth-token': localStorage.getItem('token')
            }
          }
        );
      }
      
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error('Failed to update bookmark', err);
    }
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <FaVideo />;
      case 'note':
        return <FaFileAlt />;
      case 'book':
        return <FaBook />;
      case 'citation':
        return <FaQuoteLeft />;
      default:
        return <FaFileAlt />;
    }
  };
  
  if (loading) {
    return (
      <ResourceDetailContainer>
        <div className="container">
          <LoadingMessage>Loading resource details...</LoadingMessage>
        </div>
      </ResourceDetailContainer>
    );
  }
  
  if (error || !resource) {
    return (
      <ResourceDetailContainer>
        <div className="container">
          <ErrorMessage>{error || 'Resource not found'}</ErrorMessage>
          <BackLink to="/resources">
            <FaArrowLeft /> Back to Resources
          </BackLink>
        </div>
      </ResourceDetailContainer>
    );
  }
  
  return (
    <ResourceDetailContainer>
      <div className="container">
        <BackLink to="/resources">
          <FaArrowLeft /> Back to Resources
        </BackLink>
        
        <ResourceHeader>
          <ResourceType>
            {getTypeIcon(resource.type)}
            <span>{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</span>
          </ResourceType>
          <ResourceTitle>{resource.title}</ResourceTitle>
          <ResourceMeta>
            <MetaItem>Added on {new Date(resource.createdAt).toLocaleDateString()}</MetaItem>
            {resource.author && <MetaItem>By {resource.author}</MetaItem>}
          </ResourceMeta>
        </ResourceHeader>
        
        <ResourceContent>
          <ResourceDescription>{resource.description}</ResourceDescription>
          
          {resource.content && (
            <ResourceSection>
              <SectionTitle>Content</SectionTitle>
              <ResourceText>{resource.content}</ResourceText>
            </ResourceSection>
          )}
          
          {resource.notes && (
            <ResourceSection>
              <SectionTitle>Notes</SectionTitle>
              <ResourceText>{resource.notes}</ResourceText>
            </ResourceSection>
          )}
          
          {resource.tags && resource.tags.length > 0 && (
            <ResourceSection>
              <SectionTitle>Tags</SectionTitle>
              <TagsContainer>
                {resource.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </TagsContainer>
            </ResourceSection>
          )}
        </ResourceContent>
        
        <ResourceActions>
          {resource.url && (
            <ActionButton as="a" href={resource.url} target="_blank" rel="noopener noreferrer">
              <FaExternalLinkAlt /> Open Resource
            </ActionButton>
          )}
          
          {resource.fileUrl && (
            <ActionButton as="a" href={resource.fileUrl} download>
              <FaDownload /> Download
            </ActionButton>
          )}
          
          {user && (
            <BookmarkButton onClick={handleBookmark} isBookmarked={isBookmarked}>
              {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </BookmarkButton>
          )}
        </ResourceActions>
      </div>
    </ResourceDetailContainer>
  );
};

const ResourceDetailContainer = styled.div`
  padding: 2rem 0;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 3rem 0;
`;

const ErrorMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.error};
  padding: 2rem 0;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 2rem;
  font-weight: 500;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    text-decoration: underline;
  }
`;

const ResourceHeader = styled.div`
  margin-bottom: 2rem;
`;

const ResourceType = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${({ theme }) => `${theme.colors.primary}20`};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.5rem 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-weight: 500;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ResourceTitle = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
`;

const ResourceMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const MetaItem = styled.span`
  font-size: 0.9rem;
`;

const ResourceContent = styled.div`
  margin-bottom: 2rem;
`;

const ResourceDescription = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ResourceSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray};
`;

const ResourceText = styled.div`
  font-size: 1.1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  white-space: pre-line;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  background-color: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const ResourceActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-3px);
  }
`;

const BookmarkButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background-color: ${({ isBookmarked, theme }) => 
    isBookmarked ? `${theme.colors.success}20` : 'transparent'};
  color: ${({ isBookmarked, theme }) => 
    isBookmarked ? theme.colors.success : theme.colors.primary};
  border: 2px solid ${({ isBookmarked, theme }) => 
    isBookmarked ? theme.colors.success : theme.colors.primary};
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ isBookmarked, theme }) => 
      isBookmarked ? `${theme.colors.success}30` : `${theme.colors.primary}10`};
    transform: translateY(-3px);
  }
`;

export default ResourceDetail;