import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FaGraduationCap, FaPlayCircle, FaDownload, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Lectures = () => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/lectures', {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        setLectures(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch lectures');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchLectures();
  }, []);
  
  const filterLectures = (category) => {
    setActiveFilter(category);
  };
  
  const getFilteredLectures = () => {
    if (activeFilter === 'all') {
      return lectures;
    }
    return lectures.filter(lecture => lecture.category === activeFilter);
  };
  
  const filteredLectures = getFilteredLectures();
  
  return (
    <LecturesContainer>
      <div className="container">
        <PageHeader>
          <PageTitle>Cryptography Lectures</PageTitle>
          <PageDescription>
            Explore our comprehensive collection of cryptography lectures
          </PageDescription>
        </PageHeader>
        
        {error && (
          <ErrorMessage>
            <FaExclamationCircle />
            <span>{error}</span>
          </ErrorMessage>
        )}
        
        <FilterContainer>
          <FilterButton 
            active={activeFilter === 'all'} 
            onClick={() => filterLectures('all')}
          >
            All
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'basics'} 
            onClick={() => filterLectures('basics')}
          >
            Basics
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'symmetric'} 
            onClick={() => filterLectures('symmetric')}
          >
            Symmetric
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'asymmetric'} 
            onClick={() => filterLectures('asymmetric')}
          >
            Asymmetric
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'advanced'} 
            onClick={() => filterLectures('advanced')}
          >
            Advanced
          </FilterButton>
        </FilterContainer>
        
        {loading ? (
          <LoadingMessage>Loading lectures...</LoadingMessage>
        ) : filteredLectures.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <FaGraduationCap />
            </EmptyIcon>
            <EmptyTitle>No lectures found</EmptyTitle>
            <EmptyDescription>
              {activeFilter !== 'all' 
                ? `No lectures found in the "${activeFilter}" category.` 
                : 'No lectures have been added yet.'}
            </EmptyDescription>
          </EmptyState>
        ) : (
          <LecturesGrid>
            {filteredLectures.map(lecture => (
              <LectureCard key={lecture._id}>
                <LectureImage src={lecture.thumbnail || 'https://via.placeholder.com/300x200?text=Lecture'} alt={lecture.title} />
                <LectureCategory>{lecture.category}</LectureCategory>
                <LectureContent>
                  <LectureTitle>{lecture.title}</LectureTitle>
                  <LectureInstructor>
                    By {lecture.instructor || 'Unknown Instructor'}
                  </LectureInstructor>
                  <LectureDescription>
                    {lecture.description.length > 100 
                      ? `${lecture.description.substring(0, 100)}...` 
                      : lecture.description}
                  </LectureDescription>
                  <LectureActions>
                    <ActionButton primary>
                      <FaPlayCircle />
                      <span>Watch</span>
                    </ActionButton>
                    <ActionButton>
                      <FaDownload />
                      <span>Download</span>
                    </ActionButton>
                  </LectureActions>
                </LectureContent>
              </LectureCard>
            ))}
          </LecturesGrid>
        )}
      </div>
    </LecturesContainer>
  );
};

const LecturesContainer = styled.div`
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

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => `${theme.colors.error}20`};
  color: ${({ theme }) => theme.colors.error};
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1.5rem;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${({ active, theme }) => 
    active ? theme.colors.primary : `${theme.colors.gray}20`};
  color: ${({ active }) => active ? 'white' : 'inherit'};
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ active, theme }) => 
      active ? theme.colors.primary : `${theme.colors.gray}40`};
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 3rem 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 0;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  color: ${({ theme }) => theme.colors.gray};
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h2`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
`;

const EmptyDescription = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const LecturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const LectureCard = styled.div`
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

const LectureImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  object-position: center;
`;

const LectureCategory = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const LectureContent = styled.div`
  padding: 1.2rem;
`;

const LectureTitle = styled.h3`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;

const LectureInstructor = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.8rem;
  font-weight: 500;
`;

const LectureDescription = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1.2rem;
  line-height: 1.5;
`;

const LectureActions = styled.div`
  display: flex;
  gap: 0.8rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background-color: ${({ primary, theme }) => 
    primary ? theme.colors.primary : 'transparent'};
  color: ${({ primary, theme }) => 
    primary ? 'white' : theme.colors.text};
  border: ${({ primary, theme }) => 
    primary ? 'none' : `1px solid ${theme.colors.gray}`};
  border-radius: 5px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    background-color: ${({ primary, theme }) => 
      primary ? theme.colors.primaryDark : `${theme.colors.gray}20`};
  }
`;

export default Lectures;