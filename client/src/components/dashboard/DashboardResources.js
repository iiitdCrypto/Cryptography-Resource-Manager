import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBook, FaPlus, FaVideo, FaFilePdf, FaFilePowerpoint, FaFile, FaTrash, FaEdit, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddResource from './AddResource';

const DashboardResources = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/resources');
      setResources(response.data);
    } catch (err) {
      setError('Failed to fetch resources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceAdded = (newResource) => {
    setResources(prev => [...prev, newResource]);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <FaVideo />;
      case 'book': return <FaBook />;
      case 'pdf': return <FaFilePdf />;
      case 'ppt': return <FaFilePowerpoint />;
      default: return <FaFile />;
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await axios.delete(`http://localhost:5001/api/resources/${id}`);
        setResources(resources.filter(resource => resource._id !== id));
      } catch (err) {
        console.error('Failed to delete resource:', err);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/resources/edit/${id}`);
  };

  return (
    <DashboardContainer>
      <Header>
        <div>
          <h1>Resource Management</h1>
          <p>Add and manage cryptography resources</p>
        </div>
        <AddButton onClick={() => setShowAddModal(true)}>
          <FaPlus />
          <span>Add Resource</span>
        </AddButton>
      </Header>

      {loading ? (
        <LoadingMessage>
          <Spinner />
          Loading resources...
        </LoadingMessage>
      ) : error ? (
        <ErrorMessage>
          <FaExclamationCircle />
          {error}
        </ErrorMessage>
      ) : resources.length === 0 ? (
        <EmptyMessage>
          <FaBook />
          <h2>No Resources Yet</h2>
          <p>Click the Add Resource button to create your first resource.</p>
        </EmptyMessage>
      ) : (
        <ResourcesGrid>
          {resources.map(resource => (
            <ResourceCard key={resource._id}>
              <ResourceHeader>
                <TypeIcon>{getTypeIcon(resource.type)}</TypeIcon>
                <ResourceType>{resource.type.toUpperCase()}</ResourceType>
                <ResourceActions>
                  <ActionButton onClick={() => handleEdit(resource._id)}>
                    <FaEdit />
                  </ActionButton>
                  <ActionButton danger onClick={() => handleDeleteResource(resource._id)}>
                    <FaTrash />
                  </ActionButton>
                </ResourceActions>
              </ResourceHeader>
              
              <ResourceTitle>{resource.title}</ResourceTitle>
              <ResourceAuthor>{resource.author || 'Unknown Author'}</ResourceAuthor>
              
              <ResourceDescription>
                {resource.description}
              </ResourceDescription>
              
              {resource.tags && resource.tags.length > 0 && (
                <TagsContainer>
                  {resource.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </TagsContainer>
              )}
              
              <ResourceMeta>
                <MetaItem>Added: {new Date(resource.createdAt).toLocaleDateString()}</MetaItem>
              </ResourceMeta>
            </ResourceCard>
          ))}
        </ResourcesGrid>
      )}

      {showAddModal && (
        <AddResource 
          onClose={() => setShowAddModal(false)}
          onResourceAdded={handleResourceAdded}
        />
      )}
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 1rem;
  }
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  
  svg {
    font-size: 3rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ResourceCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: ${({ theme }) => theme.shadows.small};
`;

const ResourceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TypeIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.2rem;
`;

const ResourceType = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textLight};
  flex: 1;
`;

const ResourceActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${({ danger, theme }) => danger ? theme.colors.error : theme.colors.primary};
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: ${({ danger, theme }) => danger ? theme.colors.errorDark : theme.colors.primaryDark};
  }
`;

const ResourceTitle = styled.h3`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;

const ResourceAuthor = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1rem;
`;

const ResourceDescription = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  padding: 0.25rem 0.5rem;
  background-color: ${({ theme }) => `${theme.colors.primary}10`};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  font-size: 0.8rem;
`;

const ResourceMeta = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 1rem;
  margin-top: auto;
`;

const MetaItem = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: ${({ theme }) => `${theme.colors.error}10`};
  color: ${({ theme }) => theme.colors.error};
  border-radius: 4px;

  svg {
    font-size: 1.2rem;
  }
`;

export default DashboardResources;