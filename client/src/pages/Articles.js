import React, { useState, useEffect, useRef, useCallback } from 'react';
// Remove axios if not using it directly
// import axios from 'axios';
import styled from 'styled-components';
import { FaSearch, FaFilter } from 'react-icons/fa';
import ArticleCard from '../components/ArticleCard';
import Loader from '../components/Loader';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  
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
      setArticles([]);
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
      // For now, simulate API pagination with mock data
      const pageSize = 9; // Show 9 articles per page (3x3 grid)
      const startIndex = (pageNum - 1) * pageSize;
      const mockArticles = generateMockArticles(100, 0); // Generate 100 mock articles
      
      // Apply filters
      let filteredArticles = mockArticles;
      
      // Filter by category if needed
      if (cat !== 'all') {
        filteredArticles = filteredArticles.filter(article => article.category === cat);
      }
      
      // Filter by search term if provided
      if (search) {
        const searchLower = search.toLowerCase();
        filteredArticles = filteredArticles.filter(article => 
          article.title.toLowerCase().includes(searchLower) || 
          article.description.toLowerCase().includes(searchLower)
        );
      }
      
      // Get the current page of articles
      const paginatedArticles = filteredArticles.slice(startIndex, startIndex + pageSize);
      
      // Update state
      setArticles(prevArticles => {
        if (pageNum === 1) {
          return paginatedArticles;
        } else {
          return [...prevArticles, ...paginatedArticles];
        }
      });
      
      // Check if there are more articles to load
      setHasMore(startIndex + pageSize < filteredArticles.length);
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

  // Remove or comment out unused functions
  /*
  // Function to detect the category of an article based on its content
  const detectCategory = (text) => {
    text = text.toLowerCase();
    
    if (text.includes('blockchain') || text.includes('bitcoin') || text.includes('ethereum')) {
      return 'blockchain';
    } else if (text.includes('cryptanalysis') || text.includes('breaking') || text.includes('attack')) {
      return 'cryptanalysis';
    } else if (text.includes('security') || text.includes('protection') || text.includes('defense')) {
      return 'security';
    } else if (text.includes('encryption') || text.includes('cipher') || text.includes('encrypt')) {
      return 'encryption';
    } else if (text.includes('algorithm') || text.includes('protocol')) {
      return 'algorithms';
    } else {
      return 'cryptography';
    }
  };

  // Function to check if an article is related to cryptography
  const isCryptographyRelated = (text) => {
    text = text.toLowerCase();
    const cryptoKeywords = [
      'cryptography', 'encryption', 'decryption', 'cipher', 'hash', 'blockchain',
      'security', 'privacy', 'key', 'algorithm', 'rsa', 'aes', 'des', 'sha',
      'digital signature', 'authentication', 'cryptanalysis', 'symmetric', 'asymmetric'
    ];
    
    return cryptoKeywords.some(keyword => text.includes(keyword));
  };
  */

  // Setup intersection observer for infinite scrolling
  const lastArticleElementRef = useCallback(node => {
    if (loading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchArticles(page + 1, searchTerm, category);
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
        
        <ArticlesGrid>
          {articles.map((article, index) => {
            if (articles.length === index + 1) {
              return (
                <div ref={lastArticleElementRef} key={article.id}>
                  <ArticleCard article={article} />
                </div>
              );
            } else {
              return <ArticleCard key={article.id} article={article} />;
            }
          })}
        </ArticlesGrid>
        
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
`;

const ArticlesHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.text};
  }
  
  p {
    color: ${({ theme }) => theme.colors.textLight};
    font-size: 1.1rem;
  }
`;

const SearchFilterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const SearchForm = styled.form`
  display: flex;
  flex: 1;
  max-width: 500px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px 0 0 4px;
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
  border-radius: 0 4px 4px 0;
  padding: 0 1rem;
  cursor: pointer;
  
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

const ArticlesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
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

export default Articles;