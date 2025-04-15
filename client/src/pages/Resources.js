import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { FaPlus, FaSearch, FaFilter, FaVideo, FaFileAlt, FaBook, FaQuoteLeft, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    tag: 'all'
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/resources');
        setResources(response.data);
        
        // Extract unique tags from resources
        const tags = new Set();
        response.data.forEach(resource => {
          if (resource.tags && Array.isArray(resource.tags)) {
            resource.tags.forEach(tag => tags.add(tag));
          }
        });
        
        setAvailableTags(Array.from(tags));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch resources');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchResources();
  }, []);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
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
  
  const filteredResources = resources.filter(resource => {
    // Search term filter
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = filters.type === 'all' || resource.type === filters.type;
    
    // Tag filter
    const matchesTag = filters.tag === 'all' || 
      (resource.tags && resource.tags.includes(filters.tag));
    
    return matchesSearch && matchesType && matchesTag;
  });
  
  return (
    <ResourcesContainer>
      <div className="container">
        <PageHeader>
          <PageTitle>Cryptographic Resources</PageTitle>
          <PageDescription>
            Explore and learn from our collection of cryptography resources
          </PageDescription>
        </PageHeader>
        
        <ControlsContainer>
          <SearchContainer>
            <SearchBar>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput 
                type="text" 
                placeholder="Search resources..." 
                value={searchTerm}
                onChange={handleSearch}
              />
            </SearchBar>
          </SearchContainer>
          
          <ControlsActions>
            <FilterButton onClick={toggleFilters}>
              <FaFilter />
              <span>Filters</span>
            </FilterButton>
            
            {user && user.role === 'admin' && (
              <AddButton as={Link} to="/resources/add">
                <FaPlus />
                <span>Add Resource</span>
              </AddButton>
            )}
          </ControlsActions>
        </ControlsContainer>
        
        {showFilters && (
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Resource Type</FilterLabel>
              <FilterSelect 
                name="type" 
                value={filters.type} 
                onChange={handleFilterChange}
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="note">Notes</option>
                <option value="book">Books</option>
                <option value="citation">Citations</option>
              </FilterSelect>
            </FilterGroup>
            
            <FilterGroup>
              <FilterLabel>Tag</FilterLabel>
              <FilterSelect 
                name="tag" 
                value={filters.tag} 
                onChange={handleFilterChange}
              >
                <option value="all">All Tags</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </FilterSelect>
            </FilterGroup>
          </FiltersContainer>
        )}
        
        {loading ? (
          <LoadingMessage>Loading resources...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : filteredResources.length === 0 ? (
          <EmptyState>
            <EmptyTitle>No resources found</EmptyTitle>
            <EmptyDescription>
              {searchTerm || filters.type !== 'all' || filters.tag !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No resources have been added yet.'}
            </EmptyDescription>
            {user && user.role === 'admin' && (
              <AddResourceLink to="/resources/add">Add Resource</AddResourceLink>
            )}
          </EmptyState>
        ) : (
          <ResourcesGrid>
            {filteredResources.map(resource => (
              <ResourceCard key={resource._id}>
                <ResourceType>
                  {getTypeIcon(resource.type)}
                  <span>{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</span>
                </ResourceType>
                <ResourceTitle to={`/resources/${resource._id}`}>
                  {resource.title}
                </ResourceTitle>
                <ResourceDescription>
                  {resource.description.length > 150
                    ? `${resource.description.substring(0, 150)}...`
                    : resource.description}
                </ResourceDescription>
                
                {resource.tags && resource.tags.length > 0 && (
                  <TagsContainer>
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                    {resource.tags.length > 3 && (
                      <TagCount>+{resource.tags.length - 3}</TagCount>
                    )}
                  </TagsContainer>
                )}
                
                <ResourceFooter>
                  <ResourceMeta>
                    <MetaItem>Added on {new Date(resource.createdAt).toLocaleDateString()}</MetaItem>
                  </ResourceMeta>
                  
                  {resource.url && (
                    <ExternalLink href={resource.url} target="_blank" rel="noopener noreferrer">
                      <FaExternalLinkAlt />
                    </ExternalLink>
                  )}
                </ResourceFooter>
              </ResourceCard>
            ))}
          </ResourcesGrid>
        )}
      </div>
    </ResourcesContainer>
  );
};

const ResourcesContainer = styled.div`
  padding: 2rem 0;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;

const PageDescription = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
`;

const SearchContainer = styled.div`
  flex: 1;
  min-width: 250px;
`;

const SearchBar = styled.div`
  position: relative;
`;

const SearchIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 3rem;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  border-radius: 5px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ControlsActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
  }
`;

const AddButton = styled.button`
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
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: ${({ theme }) => `${theme.colors.gray}20`};
  border-radius: 5px;
  margin-bottom: 2rem;
`;

const FilterGroup = styled.div`
  flex: 1;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const FilterSelect = styled.select`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  border-radius: 5px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
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

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 0;
`;

const EmptyTitle = styled.h2`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
`;

const EmptyDescription = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
`;

const AddResourceLink = styled(Link)`
  display: inline-block;
  padding: 0.8rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 5px;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-3px);
  }
`;

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ResourceCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

const ResourceType = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${({ theme }) => `${theme.colors.primary}20`};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.3rem 0.8rem;
  border-radius: 5px;
  margin-bottom: 0.8rem;
  font-size: 0.9rem;
  font-weight: 500;
  align-self: flex-start;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ResourceTitle = styled(Link)`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.8rem;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ResourceDescription = styled.p`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  line-height: 1.5;
  flex-grow: 1;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background-color: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const TagCount = styled.span`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const ResourceFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ResourceMeta = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
`;

const MetaItem = styled.span`
  font-size: 0.9rem;
`;

const ExternalLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: ${({ theme }) => `${theme.colors.primary}10`};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;

export default Resources;