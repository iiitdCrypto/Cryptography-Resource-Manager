import React, { useState, useEffect, useRef, useCallback } from 'react';
// Remove axios if not using it directly
// import axios from 'axios';
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
    { id: 'blockchain', name: 'Blockchain' },
    { id: 'security', name: 'Security' },
    { id: 'encryption', name: 'Encryption' },
    { id: 'algorithms', name: 'Algorithms' }
  ];
  // Remove the newlyLoadedArticles state since we'll use a single loader
  
  // Function to fetch articles from multiple sources
  const fetchArticles = useCallback(async (pageNum = 1, search = '', cat = 'all') => {
    if (pageNum === 1) {
      setArticles({ academic: [], news: [] });
    }
    
    setLoading(true);
    setError(null);
    
    // Add a slight delay to show the loader for at least 750ms
    const startTime = Date.now();
    
    // Generate a larger set of mock articles for better testing
    const generateMockArticles = (count, startIndex = 0) => {
      // Real cryptography topics and resources
      const articleData = [
        {
          title: "Understanding RSA Algorithm: Public Key Cryptography Explained",
          description: "A comprehensive guide to RSA encryption, one of the first practical public-key cryptosystems widely used for secure data transmission.",
          url: "https://en.wikipedia.org/wiki/RSA_(cryptosystem)",
          category: "algorithms",
          source: "Cryptography Journal",
          type: "academic",
          imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        },
        {
          title: "AES Encryption: How the Advanced Encryption Standard Works",
          description: "Detailed explanation of the Advanced Encryption Standard (AES), a specification for the encryption of electronic data established by the U.S. NIST.",
          url: "https://www.nist.gov/publications/advanced-encryption-standard-aes",
          category: "encryption",
          source: "NIST Publications",
          type: "academic",
          imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        },
        {
          title: "Blockchain Technology: Beyond Cryptocurrency",
          description: "Exploring how blockchain technology provides a secure, decentralized ledger for transactions beyond just cryptocurrency applications.",
          url: "https://www.ibm.com/topics/blockchain",
          category: "blockchain",
          source: "IBM Research",
          type: "news",
          imageUrl: "https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        },
        {
          title: "Quantum Cryptography: Preparing for the Post-Quantum Era",
          description: "How researchers are developing quantum-resistant algorithms to protect against future quantum computing threats to current encryption methods.",
          url: "https://www.ncsc.gov.uk/whitepaper/quantum-safe-cryptography",
          category: "cryptography",
          source: "National Cyber Security Centre",
          type: "academic",
          imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        },
        {
          title: "Side-Channel Attacks: The Hidden Threat to Cryptographic Systems",
          description: "Analysis of side-channel attacks that exploit information gained from the physical implementation of a cryptosystem rather than brute force.",
          url: "https://csrc.nist.gov/Projects/Side-Channel-Analysis",
          category: "cryptanalysis",
          source: "Security Weekly",
          type: "news",
          imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        },
        {
          title: "Zero-Knowledge Proofs: Proving Knowledge Without Revealing It",
          description: "How zero-knowledge proofs allow one party to prove to another that a statement is true without revealing any information beyond the validity of the statement.",
          url: "https://zkp.science/",
          category: "cryptography",
          source: "Cryptography Journal",
          type: "academic",
          imageUrl: "https://images.unsplash.com/photo-1633265486064-086b219458ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        },
        {
          title: "Implementing Secure Password Storage with Bcrypt",
          description: "Best practices for securely storing passwords using the bcrypt hashing function to protect user credentials in the event of a data breach.",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
          category: "security",
          source: "OWASP Foundation",
          type: "news",
          imageUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        },
        {
          title: "Elliptic Curve Cryptography: Smaller Keys, Same Security",
          description: "How ECC provides the same level of security as traditional methods like RSA but with significantly smaller key sizes.",
          url: "https://blog.cloudflare.com/a-relatively-easy-to-understand-primer-on-elliptic-curve-cryptography/",
          category: "algorithms",
          source: "IEEE Spectrum",
          type: "academic",
          imageUrl: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        },
        {
          title: "TLS 1.3: Improvements in Security and Performance",
          description: "Overview of the security and performance improvements in TLS 1.3 compared to previous versions of the protocol.",
          url: "https://www.ietf.org/rfc/rfc8446.txt",
          category: "security",
          source: "IETF",
          type: "news",
          imageUrl: "https://images.unsplash.com/photo-1480944657103-7fed22359e1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        },
        {
          title: "Homomorphic Encryption: Computing on Encrypted Data",
          description: "Exploring how homomorphic encryption allows computations to be performed on encrypted data without decrypting it first.",
          url: "https://www.microsoft.com/en-us/research/project/homomorphic-encryption/",
          category: "encryption",
          source: "Microsoft Research",
          type: "academic",
          imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
        }
      ];
      
      const result = [];
      
      for (let i = 0; i < count; i++) {
        const index = (startIndex + i) % articleData.length;
        const article = articleData[index];
        
        // Calculate a date within the last 3 years
        const date = new Date();
        date.setDate(date.getDate() - (i * 14)); // Each article is about two weeks apart
        
        result.push({
          id: `article-${startIndex + i}`,
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.imageUrl, // Use the direct image URL instead of dynamic Unsplash
          source: article.source,
          publishedAt: date.toISOString().split('T')[0],
          category: article.category,
          type: article.type
        });
      }
      
      return result;
    };
    
    try {
      const pageSize = 9;
      const startIndex = (pageNum - 1) * pageSize;
      const mockArticles = generateMockArticles(100, 0);
      
      // Apply category filter first
      let filteredArticles = cat !== 'all' 
        ? mockArticles.filter(article => article.category === cat)
        : mockArticles;
      
      // Then apply search filter if needed
      if (search) {
        const searchLower = search.toLowerCase();
        filteredArticles = filteredArticles.filter(article => 
          article.title.toLowerCase().includes(searchLower) || 
          article.description.toLowerCase().includes(searchLower)
        );
      }

      // Split articles by type before pagination
      const academicArticles = filteredArticles.filter(article => article.type === 'academic');
      const newsArticles = filteredArticles.filter(article => article.type === 'news');

      // Get paginated results for each type
      const paginatedAcademic = academicArticles.slice(startIndex, startIndex + pageSize);
      const paginatedNews = newsArticles.slice(startIndex, startIndex + pageSize);

      // Update state based on page number
      setArticles(prevArticles => {
        if (pageNum === 1) {
          return { academic: paginatedAcademic, news: paginatedNews };
        }
        // Ensure no duplicates when adding new articles
        const existingAcademicIds = new Set(prevArticles.academic.map(article => article.id));
        const existingNewsIds = new Set(prevArticles.news.map(article => article.id));

        const newAcademic = paginatedAcademic.filter(article => !existingAcademicIds.has(article.id));
        const newNews = paginatedNews.filter(article => !existingNewsIds.has(article.id));

        return {
          academic: [...prevArticles.academic, ...newAcademic],
          news: [...prevArticles.news, ...newNews]
        };
      });

      // Check if there are more articles to load
      const totalAcademic = academicArticles.length;
      const totalNews = newsArticles.length;
      setHasMore(startIndex + pageSize < Math.max(totalAcademic, totalNews));
      setPage(pageNum);

      // Ensure the loader is shown for at least 750ms
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 750) {
        await new Promise(resolve => setTimeout(resolve, 750 - elapsedTime));
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to fetch articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

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
              onChange={(e) => setCategory(e.target.value)}
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