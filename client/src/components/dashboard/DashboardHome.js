import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FiUsers, FiFileText, FiCalendar, FiEye, FiTrendingUp, FiTrendingDown, FiPlusCircle, FiAlertCircle, FiCheckCircle, FiEdit, FiRefreshCw } from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const DashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/summary');
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data');
      setLoading(false);
      console.error('Dashboard data error:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 300000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) {
    return <LoadingContainer>Loading dashboard data...</LoadingContainer>;
  }

  if (error) {
    return (
      <ErrorContainer>
        <FiAlertCircle size={24} />
        <div>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <RefreshButton onClick={handleRefresh}>
            <FiRefreshCw size={16} />
            Try Again
          </RefreshButton>
        </div>
      </ErrorContainer>
    );
  }

  // Prepare visitor data for chart
  const visitorData = {
    labels: dashboardData?.visitorHistory.map(item => new Date(item.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Total Views',
        data: dashboardData?.visitorHistory.map(item => item.count) || [],
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.2)',
        fill: true,
      },
      {
        label: 'Unique Visitors',
        data: dashboardData?.visitorHistory.map(item => item.unique_count) || [],
        borderColor: '#f50057',
        backgroundColor: 'rgba(245, 0, 87, 0.2)',
        fill: true,
      }
    ]
  };

  // Prepare resource type distribution data
  const resourceTypeData = {
    labels: ['Videos', 'Notes', 'Books', 'Citations'],
    datasets: [
      {
        data: [
          dashboardData?.resourceStats.videos || 0,
          dashboardData?.resourceStats.notes || 0,
          dashboardData?.resourceStats.books || 0,
          dashboardData?.resourceStats.citations || 0
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare monthly stats for bar chart
  const monthlyStatsData = {
    labels: dashboardData?.monthlyStats.map(item => item.month) || [],
    datasets: [
      {
        label: 'Resources Added',
        data: dashboardData?.monthlyStats.map(item => item.resources_added) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'New Users',
        data: dashboardData?.monthlyStats.map(item => item.new_users) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Events',
        data: dashboardData?.monthlyStats.map(item => item.events) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Calculate resource growth rate
  const currentResources = dashboardData?.resourceStats.total || 0;
  const previousResources = dashboardData?.previousPeriodStats?.resources || 0;
  const resourceGrowthRate = previousResources ? ((currentResources - previousResources) / previousResources) * 100 : 0;
  
  // Calculate user growth rate
  const currentUsers = dashboardData?.userStats.total || 0;
  const previousUsers = dashboardData?.previousPeriodStats?.users || 0;
  const userGrowthRate = previousUsers ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;

  // Prepare recent activity data
  const recentActivities = dashboardData?.recentActivities || [];
  
  // Prepare pending tasks
  const pendingTasks = dashboardData?.pendingTasks || [];

  return (
    <DashboardContainer>
      <DashboardHeader>
        <PageTitle>Dashboard Overview</PageTitle>
        <RefreshButton onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : (
            <>
              <FiRefreshCw size={16} />
              Refresh Data
            </>
          )}
        </RefreshButton>
      </DashboardHeader>
      
      <StatCardsContainer>
        <StatCard>
          <StatIcon color="#3f51b5">
            <FiUsers size={24} />
          </StatIcon>
          <StatContent>
            <StatNumber>{dashboardData?.userStats.total || 0}</StatNumber>
            <StatLabel>Total Users</StatLabel>
            <GrowthIndicator positive={userGrowthRate >= 0}>
              {userGrowthRate >= 0 ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
              <span>{Math.abs(userGrowthRate).toFixed(1)}% from last month</span>
            </GrowthIndicator>
          </StatContent>
          <StatFooter>
            <StatDetail>
              <span>Admin: {dashboardData?.userStats.admin || 0}</span>
              <span>Authorised: {dashboardData?.userStats.authorised || 0}</span>
              <span>Regular: {dashboardData?.userStats.user || 0}</span>
            </StatDetail>
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatIcon color="#f50057">
            <FiFileText size={24} />
          </StatIcon>
          <StatContent>
            <StatNumber>{dashboardData?.resourceStats.total || 0}</StatNumber>
            <StatLabel>Resources</StatLabel>
            <GrowthIndicator positive={resourceGrowthRate >= 0}>
              {resourceGrowthRate >= 0 ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
              <span>{Math.abs(resourceGrowthRate).toFixed(1)}% from last month</span>
            </GrowthIndicator>
          </StatContent>
          <StatFooter>
            <StatDetail>
              <span>Contributors: {dashboardData?.resourceStats.unique_contributors || 0}</span>
            </StatDetail>
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatIcon color="#00bcd4">
            <FiCalendar size={24} />
          </StatIcon>
          <StatContent>
            <StatNumber>{dashboardData?.eventStats.total || 0}</StatNumber>
            <StatLabel>Events</StatLabel>
          </StatContent>
          <StatFooter>
            <StatDetail>
              <span>Upcoming: {dashboardData?.eventStats.upcoming || 0}</span>
              <span>Today: {dashboardData?.eventStats.today || 0}</span>
            </StatDetail>
          </StatFooter>
        </StatCard>

        <StatCard>
          <StatIcon color="#4caf50">
            <FiEye size={24} />
          </StatIcon>
          <StatContent>
            <StatNumber>{dashboardData?.todayVisitors.total || 0}</StatNumber>
            <StatLabel>Today's Views</StatLabel>
          </StatContent>
          <StatFooter>
            <StatDetail>
              <span>Unique: {dashboardData?.todayVisitors.unique || 0}</span>
              <span>Avg Time: {dashboardData?.todayVisitors.avg_time || '0m'}</span>
            </StatDetail>
          </StatFooter>
        </StatCard>
      </StatCardsContainer>

      <DashboardGridLayout>
        <VisitorChartSection>
          <ChartCard>
            <ChartTitle>Visitor Statistics (Last 30 Days)</ChartTitle>
            <ChartContainer>
              <Line 
                data={visitorData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </ChartContainer>
          </ChartCard>
        </VisitorChartSection>

        <ResourceDistributionSection>
          <ChartCard>
            <ChartTitle>Resource Distribution</ChartTitle>
            <ChartContainer>
              <Doughnut 
                data={resourceTypeData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }}
              />
            </ChartContainer>
          </ChartCard>
        </ResourceDistributionSection>

        <MonthlyStatsSection>
          <ChartCard>
            <ChartTitle>Monthly Statistics</ChartTitle>
            <ChartContainer>
              <Bar 
                data={monthlyStatsData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </ChartContainer>
          </ChartCard>
        </MonthlyStatsSection>

        <QuickActionsSection>
          <SectionTitle>Quick Actions</SectionTitle>
          <QuickActionGrid>
            <QuickActionButton to="/admin/resources/add">
              <FiFileText size={24} />
              <span>Add Resource</span>
            </QuickActionButton>
            <QuickActionButton to="/admin/events/add">
              <FiCalendar size={24} />
              <span>Add Event</span>
            </QuickActionButton>
            <QuickActionButton to="/admin/users">
              <FiUsers size={24} />
              <span>Manage Users</span>
            </QuickActionButton>
            <QuickActionButton to="/admin/articles/create">
              <FiEdit size={24} />
              <span>Write Article</span>
            </QuickActionButton>
          </QuickActionGrid>
        </QuickActionsSection>

        <PendingTasksSection>
          <SectionTitle>Priority Tasks</SectionTitle>
          <TaskList>
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task, index) => (
                <TaskItem key={index} priority={task.priority}>
                  <TaskIcon>
                    {task.status === 'completed' ? (
                      <FiCheckCircle size={18} />
                    ) : (
                      <FiAlertCircle size={18} />
                    )}
                  </TaskIcon>
                  <TaskContent>
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskDescription>{task.description}</TaskDescription>
                    <TaskMeta>
                      <TaskDueDate>Due: {new Date(task.due_date).toLocaleDateString()}</TaskDueDate>
                      <TaskStatus status={task.status}>{task.status}</TaskStatus>
                    </TaskMeta>
                  </TaskContent>
                </TaskItem>
              ))
            ) : (
              <NoData>No pending tasks</NoData>
            )}
          </TaskList>
        </PendingTasksSection>

        <ActivitySection>
          <SectionTitle>Recent Activities</SectionTitle>
          <ActivityList>
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
              <ActivityItem key={index}>
                <ActivityIcon action={activity.action_type}>
                  {getActivityIcon(activity.action_type)}
                </ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>
                    <strong>{activity.actor_name}</strong> {getActivityDescription(activity)}
                  </ActivityTitle>
                  <ActivityTime>
                    {new Date(activity.created_at).toLocaleString()}
                  </ActivityTime>
                </ActivityContent>
              </ActivityItem>
            )) : (
              <NoData>No recent activity to display</NoData>
            )}
          </ActivityList>
        </ActivitySection>
      </DashboardGridLayout>
    </DashboardContainer>
  );
};

// Helper function to get activity description
const getActivityDescription = (activity) => {
  const { action_type, entity_type } = activity;
  
  switch (action_type) {
    case 'CREATE':
      return `created a new ${entity_type.toLowerCase()}`;
    case 'UPDATE':
      return `updated a ${entity_type.toLowerCase()}`;
    case 'DELETE':
      return `deleted a ${entity_type.toLowerCase()}`;
    case 'LOGIN':
      return 'logged in to the system';
    case 'PERMISSION_CHANGE':
      return `changed permissions for a ${entity_type.toLowerCase()}`;
    default:
      return `performed ${action_type.toLowerCase()} on ${entity_type.toLowerCase()}`;
  }
};

// Helper function to get icon based on activity type
const getActivityIcon = (actionType) => {
  switch (actionType) {
    case 'CREATE':
      return <FiPlusCircle size={16} />;
    case 'UPDATE':
      return <FiEdit size={16} />;
    case 'DELETE':
      return <FiFileText size={16} />;
    case 'LOGIN':
      return <FiUsers size={16} />;
    case 'PERMISSION_CHANGE':
      return <FiUsers size={16} />;
    default:
      return <FiFileText size={16} />;
  }
};

// Styled Components
const DashboardContainer = styled.div`
  width: 100%;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e9ecef;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  h3 {
    margin: 0 0 0.5rem 0;
  }
  
  p {
    margin: 0 0 1rem 0;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #333;
`;

const StatCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => `${props.color}10`};
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const StatContent = styled.div`
  margin-bottom: 1rem;
`;

const StatNumber = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #333;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const GrowthIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  color: ${props => props.positive ? '#4caf50' : '#f44336'};
`;

const StatFooter = styled.div`
  margin-top: auto;
  border-top: 1px solid #eee;
  padding-top: 0.75rem;
`;

const StatDetail = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #666;
  
  span {
    padding: 0.25rem 0.5rem;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
`;

const DashboardGridLayout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-areas:
    "visitor-chart resource-distribution"
    "monthly-stats quick-actions"
    "activities pending-tasks";
  gap: 1.5rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "visitor-chart"
      "resource-distribution"
      "monthly-stats"
      "quick-actions"
      "pending-tasks"
      "activities";
  }
`;

const VisitorChartSection = styled.div`
  grid-area: visitor-chart;
`;

const ResourceDistributionSection = styled.div`
  grid-area: resource-distribution;
`;

const MonthlyStatsSection = styled.div`
  grid-area: monthly-stats;
`;

const QuickActionsSection = styled.div`
  grid-area: quick-actions;
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const PendingTasksSection = styled.div`
  grid-area: pending-tasks;
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const ActivitySection = styled.div`
  grid-area: activities;
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const ChartCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: 100%;
`;

const ChartTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #333;
`;

const ChartContainer = styled.div`
  height: 300px;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
`;

const QuickActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const QuickActionButton = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  
  svg {
    margin-bottom: 0.5rem;
    color: #3f51b5;
  }
  
  &:hover {
    background-color: #e9ecef;
    transform: translateY(-2px);
  }
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TaskItem = styled.div`
  display: flex;
  padding: 1rem;
  border-radius: 4px;
  background-color: ${props => {
    switch (props.priority) {
      case 'high':
        return '#fff8e1';
      case 'medium':
        return '#f1f8e9';
      case 'low':
        return '#f5f5f5';
      default:
        return '#f8f9fa';
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.priority) {
      case 'high':
        return '#ffc107';
      case 'medium':
        return '#8bc34a';
      case 'low':
        return '#bdbdbd';
      default:
        return '#e0e0e0';
    }
  }};
`;

const TaskIcon = styled.div`
  margin-right: 1rem;
  color: #757575;
`;

const TaskContent = styled.div`
  flex: 1;
`;

const TaskTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const TaskDescription = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TaskDueDate = styled.div`
  font-size: 0.75rem;
  color: #757575;
`;

const TaskStatus = styled.div`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: capitalize;
  background-color: ${props => {
    switch (props.status) {
      case 'completed':
        return '#e8f5e9';
      case 'in_progress':
        return '#e3f2fd';
      case 'pending':
        return '#fff8e1';
      default:
        return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'completed':
        return '#4caf50';
      case 'in_progress':
        return '#2196f3';
      case 'pending':
        return '#ff9800';
      default:
        return '#757575';
    }
  }};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  padding: 0.75rem;
  border-radius: 4px;
  background-color: #f8f9fa;
  
  &:hover {
    background-color: #f1f3f5;
  }
`;

const ActivityIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.action) {
      case 'CREATE':
        return '#4caf5010';
      case 'UPDATE':
        return '#ff980010';
      case 'DELETE':
        return '#f5005710';
      case 'LOGIN':
        return '#3f51b510';
      case 'PERMISSION_CHANGE':
        return '#9c27b010';
      default:
        return '#90caf910';
    }
  }};
  color: ${props => {
    switch (props.action) {
      case 'CREATE':
        return '#4caf50';
      case 'UPDATE':
        return '#ff9800';
      case 'DELETE':
        return '#f50057';
      case 'LOGIN':
        return '#3f51b5';
      case 'PERMISSION_CHANGE':
        return '#9c27b0';
      default:
        return '#90caf9';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  color: #333;
`;

const ActivityTime = styled.div`
  font-size: 0.75rem;
  color: #666;
`;

const NoData = styled.div`
  padding: 1rem;
  text-align: center;
  color: #666;
  font-style: italic;
`;

export default DashboardHome;
