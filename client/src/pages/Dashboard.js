import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { FaUsers, FaBook, FaBookmark, FaPlus, FaEdit, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    resources: 0,
    bookmarks: 0
  });
  const [recentResources, setRecentResources] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.role !== 'admin') return;
      
      try {
        setLoading(true);
        
        // Fetch stats
        const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        setStats(statsResponse.data);
        
        // Fetch recent resources
        const resourcesResponse = await axios.get('http://localhost:5000/api/resources?limit=5', {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        setRecentResources(resourcesResponse.data);
        
        // Fetch recent users
        const usersResponse = await axios.get('http://localhost:5000/api/admin/users?limit=5', {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        setRecentUsers(usersResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  const handleDeleteResource = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await axios.delete(`http://localhost:5000/api/resources/${id}`, {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        // Update recent resources list
        setRecentResources(recentResources.filter(resource => resource._id !== id));
        
        // Update stats
        setStats({
          ...stats,
          resources: stats.resources - 1
        });
      } catch (err) {
        console.error('Failed to delete resource', err);
      }
    }
  };
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return (
    <DashboardContainer>
      <div className="container">
        <PageHeader>
          <PageTitle>Admin Dashboard</PageTitle>
          <PageDescription>
            Manage your cryptographic resources platform
          </PageDescription>
        </PageHeader>
        
        {error && (
          <ErrorMessage>
            <FaExclamationCircle />
            <span>{error}</span>
          </ErrorMessage>
        )}
        
        {loading ? (
          <LoadingMessage>Loading dashboard data...</LoadingMessage>
        ) : (
          <>
            <StatsGrid>
              <StatCard>
                <StatIcon>
                  <FaUsers />
                </StatIcon>
                <StatContent>
                  <StatValue>{stats.users}</StatValue>
                  <StatLabel>Total Users</StatLabel>
                </StatContent>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <FaBook />
                </StatIcon>
                <StatContent>
                  <StatValue>{stats.resources}</StatValue>
                  <StatLabel>Total Resources</StatLabel>
                </StatContent>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <FaBookmark />
                </StatIcon>
                <StatContent>
                  <StatValue>{stats.bookmarks}</StatValue>
                  <StatLabel>Total Bookmarks</StatLabel>
                </StatContent>
              </StatCard>
            </StatsGrid>
            
            <DashboardGrid>
              <DashboardSection>
                <SectionHeader>
                  <SectionTitle>Recent Resources</SectionTitle>
                  <AddButton as={Link} to="/resources/add">
                    <FaPlus />
                    <span>Add Resource</span>
                  </AddButton>
                </SectionHeader>
                
                {recentResources.length === 0 ? (
                  <EmptyState>No resources found</EmptyState>
                ) : (
                  <ResourcesList>
                    {recentResources.map(resource => (
                      <ResourceItem key={resource._id}>
                        <ResourceInfo>
                          <ResourceTitle to={`/resources/${resource._id}`}>
                            {resource.title}
                          </ResourceTitle>
                          <ResourceMeta>
                            <MetaItem>Type: {resource.type}</MetaItem>
                            <MetaItem>Added: {new Date(resource.createdAt).toLocaleDateString()}</MetaItem>
                          </ResourceMeta>
                        </ResourceInfo>
                        <ResourceActions>
                          <ActionButton as={Link} to={`/resources/edit/${resource._id}`}>
                            <FaEdit />
                          </ActionButton>
                          <ActionButton 
                            onClick={() => handleDeleteResource(resource._id)}
                            danger
                          >
                            <FaTrash />
                          </ActionButton>
                        </ResourceActions>
                      </ResourceItem>
                    ))}
                  </ResourcesList>
                )}
                
                <ViewAllLink to="/resources">
                  View All Resources
                </ViewAllLink>
              </DashboardSection>
              
              <DashboardSection>
                <SectionHeader>
                  <SectionTitle>Recent Users</SectionTitle>
                </SectionHeader>
                
                {recentUsers.length === 0 ? (
                  <EmptyState>No users found</EmptyState>
                ) : (
                  <UsersList>
                    {recentUsers.map(user => (
                      <UserItem key={user._id}>
                        <UserInfo>
                          <UserName>{user.name}</UserName>
                          <UserEmail>{user.email}</UserEmail>
                          <UserMeta>
                            <MetaItem>Role: {user.role}</MetaItem>
                            <MetaItem>Joined: {new Date(user.createdAt).toLocaleDateString()}</MetaItem>
                          </UserMeta>
                        </UserInfo>
                      </UserItem>
                    ))}
                  </UsersList>
                )}
                
                <ViewAllLink to="/admin/users">
                  View All Users
                </ViewAllLink>
              </DashboardSection>
            </DashboardGrid>
          </>
        )}
      </div>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
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

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 3rem 0;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  padding: 1.5rem;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const StatIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background-color: ${({ theme }) => `${theme.colors.primary}20`};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  font-size: 1.5rem;
  margin-right: 1rem;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const DashboardSection = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  padding: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
`;

const AddButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 5px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 0;
  color: ${({ theme }) => theme.colors.textLight};
`;

const ResourcesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ResourceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 5px;
  background-color: ${({ theme }) => `${theme.colors.gray}10`};
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.gray}20`};
  }
`;

const ResourceInfo = styled.div`
  flex: 1;
`;

const ResourceTitle = styled(Link)`
  display: block;
  font-size: 1.1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ResourceMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.9rem;
`;

const MetaItem = styled.span``;

const ResourceActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  background-color: ${({ danger, theme }) => 
    danger ? `${theme.colors.error}20` : `${theme.colors.primary}20`};
  color: ${({ danger, theme }) => 
    danger ? theme.colors.error : theme.colors.primary};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ danger, theme }) => 
      danger ? theme.colors.error : theme.colors.primary};
    color: white;
  }
`;

const UsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UserItem = styled.div`
  padding: 1rem;
  border-radius: 5px;
  background-color: ${({ theme }) => `${theme.colors.gray}10`};
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.gray}20`};
  }
`;

const UserInfo = styled.div``;

const UserName = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.25rem;
`;

const UserEmail = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const UserMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.9rem;
`;

const ViewAllLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default Dashboard;