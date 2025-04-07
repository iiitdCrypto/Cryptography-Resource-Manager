import React, { useState, useEffect, useRef, useCallback } from 'react';
// Remove axios if not using it directly
import axios from 'axios';
import styled from 'styled-components';
import { FaSearch, FaFilter } from 'react-icons/fa';
import ArticleCard from '../components/ArticleCard';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';

const Articles = () => {
  const [articles, setArticles] = useState({ academic: [], news: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hoveredArticle, setHoveredArticle] = useState(null);
  const observer = useRef();
  const articleObserver = useRef(
    new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first.isIntersecting) {
          loadMoreArticles();
        }
      },
      { threshold: 1 }
    )
  );
  
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'cryptography', name: 'Cryptography' },
    { id: 'cryptanalysis', name: 'Cryptanalysis' },
    { id: 'security', name: 'Security' },
    { id: 'blockchain', name: 'Blockchain' }
  ];
  // Remove the newlyLoadedArticles state since we'll use a single loader
  
  // Function to fetch articles from multiple sources
  const fetchArticles = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      console.log('Fetching articles for page:', pageNum);
      const response = await fetch(
        `http://localhost:5001/api/articles/all?page=${pageNum}&pageSize=10&search=${searchTerm}&category=${category}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (data.success && data.articles) {
        setArticles(prevArticles => {
          if (pageNum === 1) {
            return {
              academic: data.articles.academic.items || [],
              news: data.articles.news.items || []
            };
          }
          
          return {
            academic: [...new Set([...prevArticles.academic, ...(data.articles.academic.items || [])])],
            news: [...new Set([...prevArticles.news, ...(data.articles.news.items || [])])]
          };
        });
        
        setHasMore(data.articles.academic.hasMore || data.articles.news.hasMore);
        setPage(pageNum);
      } else {
        console.error('API returned unsuccessful response:', data);
        setError('Failed to fetch articles: ' + (data.message || 'Unknown error'));
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to fetch articles: ' + err.message);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [category, searchTerm]);

  const loadMoreArticles = () => {
    fetchArticles(page + 1, searchTerm, category);
  };

  // Setup intersection observer for infinite scrolling
  const lastArticleElementRef = useCallback(node => {
    if (loading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreArticles();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, page, fetchArticles, searchTerm, category]);

  // Initial fetch
  useEffect(() => {
    fetchArticles(1, searchTerm, category);
  }, [category, fetchArticles, searchTerm]); // Add searchTerm here

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(1, searchTerm, category);
  };

  // Update category handler
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setPage(1); // Reset to first page when category changes
  };

  return (
    <ArticlesContainer>
      <div className="container">
        <ArticlesHeader>
          <h1>Cryptography Articles & News</h1>
          <p>Stay updated with the latest research, news, and developments in cryptography</p>
        </ArticlesHeader>
        
        <SearchFilterContainer>
          <SearchForm onSubmit={handleSearch}>
            <SearchInput
              type="text"
              placeholder="Search for articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchButton type="submit">
              <FaSearch />
            </SearchButton>
          </SearchForm>
          
          <FilterContainer>
            <FilterIcon>
              <FaFilter />
            </FilterIcon>
            <FilterSelect 
              value={category} 
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </FilterSelect>
          </FilterContainer>
        </SearchFilterContainer>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <SectionsWrapper>
          <Section>
            <SectionHeader>
              <h1>Academic</h1>
            </SectionHeader>
            <ScrollableList>
              {articles.academic.map((article) => (
                <ArticleItem
                  key={article.id}
                  onMouseEnter={() => setHoveredArticle(article)}
                  onMouseLeave={() => setHoveredArticle(null)}
                >
                  <ArticleTitle>{article.title}</ArticleTitle>
                  {hoveredArticle?.id === article.id && (
                    <ArticleCard article={article} />
                  )}
                </ArticleItem>
              ))}
            </ScrollableList>
          </Section>

          <Section>
            <SectionHeader>
              <h1>News</h1>
            </SectionHeader>
            <ScrollableList>
              {articles.news.map((article) => (
                <ArticleItem
                  key={article.id}
                  onMouseEnter={() => setHoveredArticle(article)}
                  onMouseLeave={() => setHoveredArticle(null)}
                >
                  <ArticleTitle>{article.title}</ArticleTitle>
                  {hoveredArticle?.id === article.id && (
                    <ArticleCard article={article} />
                  )}
                </ArticleItem>
              ))}
            </ScrollableList>
          </Section>
        </SectionsWrapper>
        
        {loading && (
          <LoaderContainer>
            <Loader />
          </LoaderContainer>
        )}
        
        {!loading && articles.length === 0 && !error && (
          <NoResults>No articles found. Try a different search term or category.</NoResults>
        )}
      </div>
    </ArticlesContainer>
  );
};

const ArticlesContainer = styled.div`
  padding: 2rem 0;
  margin-top: -65px;
  background: ${({ theme }) => theme.colors.backgroundLight};
  min-height: 100vh;
`;

const ArticlesHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: bold;
  }
  
  p {
    color: ${({ theme }) => theme.colors.textLight};
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
  }
`;

const SearchFilterContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const SearchForm = styled.form`
  display: flex;
  flex: 1;
  max-width: 500px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  border-radius: 8px;
  overflow: hidden;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 1rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 0 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const FilterIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const FilterSelect = styled.select`
  padding: 0.8rem 1rem 0.8rem 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background-color: white;
  font-size: 1rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.danger}20;
  color: ${({ theme }) => theme.colors.danger};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  text-align: center;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 3rem 0;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const Section = styled.div`
  // background: ${({ theme }) => theme.colors.background};
  background: #e7e2e2;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: black 0px 0px 10px 0px;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;


  h1 {
    font-size: 1.8rem;
    color: black;
    position: relative;
    display: inline-block;
    
    &:after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      right: 0;
      height: 3px;
      background: blaCK;
      border-radius: 2px;
    }
  }
`;

const SectionsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const ScrollableList = styled.div`
  height: 600px;
  overflow-y: auto;
  padding: 1rem;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.backgroundLight};
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: gray;
    border-radius: 4px;
  }
`;

const ArticleItem = styled.div`
  position: relative;
  padding: 0.5rem;
  margin-bottom: 0.75rem;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateX(5px);
  }
`;

const ArticleTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
  padding: 1rem 1.5rem;
  // background-color: ${({ theme }) => theme.colors.background};
  background-color: #d2d4d6;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

export default Articles;