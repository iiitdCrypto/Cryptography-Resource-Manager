import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { 
  Line, Bar, Pie, Doughnut 
} from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { 
  FiBarChart2, 
  FiPieChart, 
  FiUsers, 
  FiTrendingUp, 
  FiMap, 
  FiCalendar, 
  FiClock, 
  FiDownload,
  FiFileText
} from 'react-icons/fi';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('visitors');
  const [timeRange, setTimeRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      let endpoint;
      if (activeTab === 'visitors') {
        endpoint = `/api/dashboard/visitors?timeRange=${timeRange}`;
      } else if (activeTab === 'activity') {
        endpoint = `/api/dashboard/activity?timeRange=${timeRange}`;
      } else if (activeTab === 'content') {
        endpoint = `/api/dashboard/content?timeRange=${timeRange}`;
      }
      
      const response = await axios.get(endpoint);
      setAnalyticsData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load analytics data');
      setLoading(false);
      console.error('Analytics data error:', err);
    }
  }, [activeTab, timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData, timeRange, activeTab]);

  const handleExportData = () => {
    // In a real application, you would generate a CSV file here
    alert('Export functionality would download CSV/Excel data in a real application');
  };

  // Prepare visitor trends data for chart
  const visitorTrendsData = {
    labels: analyticsData?.visitorTrends.map(item => new Date(item.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Page Views',
        data: analyticsData?.visitorTrends.map(item => item.pageViews) || [],
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Unique Visitors',
        data: analyticsData?.visitorTrends.map(item => item.uniqueVisitors) || [],
        borderColor: '#f50057',
        backgroundColor: 'rgba(245, 0, 87, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Prepare content popularity data for chart
  const contentPopularityData = {
    labels: analyticsData?.contentPopularity.map(item => item.name) || [],
    datasets: [
      {
        label: 'Views',
        data: analyticsData?.contentPopularity.map(item => item.views) || [],
        backgroundColor: [
          'rgba(63, 81, 181, 0.7)',
          'rgba(245, 0, 87, 0.7)',
          'rgba(76, 175, 80, 0.7)',
          'rgba(255, 152, 0, 0.7)',
          'rgba(0, 188, 212, 0.7)',
          'rgba(103, 58, 183, 0.7)',
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Prepare user activity data for chart
  const userActivityData = {
    labels: analyticsData?.userActivity.map(item => item.action) || [],
    datasets: [
      {
        label: 'Count',
        data: analyticsData?.userActivity.map(item => item.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
      }
    ]
  };

  // Prepare traffic sources data for chart
  const trafficSourcesData = {
    labels: analyticsData?.trafficSources.map(item => item.source) || [],
    datasets: [
      {
        label: 'Visitors',
        data: analyticsData?.trafficSources.map(item => item.count) || [],
        backgroundColor: [
          'rgba(63, 81, 181, 0.7)',
          'rgba(76, 175, 80, 0.7)',
          'rgba(255, 152, 0, 0.7)',
          'rgba(245, 0, 87, 0.7)',
        ],
        borderWidth: 0
      }
    ]
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    if (loading) {
      return <LoadingContainer>Loading analytics data...</LoadingContainer>;
    }

    if (error) {
      return <ErrorContainer>{error}</ErrorContainer>;
    }

    switch (activeTab) {
      case 'visitors':
        return (
          <TabContent>
            <ChartGrid>
              <ChartCard>
                <ChartHeader>
                  <ChartTitle>
                    <FiTrendingUp size={18} />
                    Visitor Trends
                  </ChartTitle>
                </ChartHeader>
                <ChartBody height="300px">
                  <Line 
                    data={visitorTrendsData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                      elements: {
                        line: {
                          borderWidth: 2
                        },
                        point: {
                          radius: 0,
                          hitRadius: 10,
                          hoverRadius: 4,
                        }
                      }
                    }}
                  />
                </ChartBody>
              </ChartCard>

              <ChartCard>
                <ChartHeader>
                  <ChartTitle>
                    <FiPieChart size={18} />
                    Traffic Sources
                  </ChartTitle>
                </ChartHeader>
                <ChartBody height="300px">
                  <Doughnut 
                    data={trafficSourcesData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        }
                      },
                      cutout: '60%'
                    }}
                  />
                </ChartBody>
              </ChartCard>
            </ChartGrid>

            <MetricsGrid>
              <MetricCard>
                <MetricIcon color="#3f51b5">
                  <FiUsers size={24} />
                </MetricIcon>
                <MetricContent>
                  <MetricValue>{analyticsData?.summary.totalVisitors || 0}</MetricValue>
                  <MetricLabel>Total Visitors</MetricLabel>
                </MetricContent>
                {analyticsData?.summary.visitorChange > 0 ? (
                  <MetricBadge positive>+{analyticsData.summary.visitorChange}%</MetricBadge>
                ) : (
                  <MetricBadge>{analyticsData?.summary.visitorChange}%</MetricBadge>
                )}
              </MetricCard>

              <MetricCard>
                <MetricIcon color="#f50057">
                  <FiBarChart2 size={24} />
                </MetricIcon>
                <MetricContent>
                  <MetricValue>{analyticsData?.summary.pageViews || 0}</MetricValue>
                  <MetricLabel>Page Views</MetricLabel>
                </MetricContent>
                {analyticsData?.summary.pageViewChange > 0 ? (
                  <MetricBadge positive>+{analyticsData.summary.pageViewChange}%</MetricBadge>
                ) : (
                  <MetricBadge>{analyticsData?.summary.pageViewChange}%</MetricBadge>
                )}
              </MetricCard>

              <MetricCard>
                <MetricIcon color="#00bcd4">
                  <FiClock size={24} />
                </MetricIcon>
                <MetricContent>
                  <MetricValue>{analyticsData?.summary.avgTimeOnSite || '0:00'}</MetricValue>
                  <MetricLabel>Avg. Time on Site</MetricLabel>
                </MetricContent>
                {analyticsData?.summary.timeOnSiteChange > 0 ? (
                  <MetricBadge positive>+{analyticsData.summary.timeOnSiteChange}%</MetricBadge>
                ) : (
                  <MetricBadge>{analyticsData?.summary.timeOnSiteChange}%</MetricBadge>
                )}
              </MetricCard>

              <MetricCard>
                <MetricIcon color="#4caf50">
                  <FiMap size={24} />
                </MetricIcon>
                <MetricContent>
                  <MetricValue>{analyticsData?.summary.bounceRate || '0'}%</MetricValue>
                  <MetricLabel>Bounce Rate</MetricLabel>
                </MetricContent>
                {analyticsData?.summary.bounceRateChange < 0 ? (
                  <MetricBadge positive>{analyticsData.summary.bounceRateChange}%</MetricBadge>
                ) : (
                  <MetricBadge>{analyticsData?.summary.bounceRateChange}%</MetricBadge>
                )}
              </MetricCard>
            </MetricsGrid>
          </TabContent>
        );
        
      case 'activity':
        return (
          <TabContent>
            <ChartGrid>
              <ChartCard>
                <ChartHeader>
                  <ChartTitle>
                    <FiUsers size={18} />
                    User Activities
                  </ChartTitle>
                </ChartHeader>
                <ChartBody height="300px">
                  <Pie 
                    data={userActivityData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        }
                      }
                    }}
                  />
                </ChartBody>
              </ChartCard>

              <ChartCard>
                <ChartHeader>
                  <ChartTitle>
                    <FiCalendar size={18} />
                    Activity by Day
                  </ChartTitle>
                </ChartHeader>
                <ChartBody height="300px">
                  <Bar
                    data={{
                      labels: analyticsData?.activityByDay.map(item => item.day) || [],
                      datasets: [
                        {
                          label: 'Activities',
                          data: analyticsData?.activityByDay.map(item => item.count) || [],
                          backgroundColor: 'rgba(63, 81, 181, 0.7)',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        }
                      }
                    }}
                  />
                </ChartBody>
              </ChartCard>
            </ChartGrid>

            <ActivityLogSection>
              <SectionTitle>Recent User Activity Logs</SectionTitle>
              <ActivityTable>
                <ActivityTableHeader>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Time</th>
                  <th>IP Address</th>
                </ActivityTableHeader>
                <tbody>
                  {analyticsData?.recentActivityLogs && analyticsData.recentActivityLogs.length > 0 ? (
                    analyticsData.recentActivityLogs.map((log, index) => (
                      <ActivityTableRow key={index}>
                        <td>{log.userName}</td>
                        <td>
                          <ActionBadge action={log.actionType}>
                            {log.actionType}
                          </ActionBadge>
                        </td>
                        <td>{log.resourceType}: {log.resourceName}</td>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.ipAddress}</td>
                      </ActivityTableRow>
                    ))
                  ) : (
                    <ActivityTableRow>
                      <td colSpan="5" style={{ textAlign: 'center' }}>No activity logs found</td>
                    </ActivityTableRow>
                  )}
                </tbody>
              </ActivityTable>
            </ActivityLogSection>
          </TabContent>
        );
        
      case 'content':
        return (
          <TabContent>
            <ChartGrid>
              <ChartCard>
                <ChartHeader>
                  <ChartTitle>
                    <FiBarChart2 size={18} />
                    Content Popularity
                  </ChartTitle>
                </ChartHeader>
                <ChartBody height="300px">
                  <Bar
                    data={contentPopularityData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        }
                      },
                      indexAxis: 'y'
                    }}
                  />
                </ChartBody>
              </ChartCard>
            </ChartGrid>

            <ContentStatsSection>
              <SectionTitle>Content Performance</SectionTitle>
              <ContentTable>
                <ContentTableHeader>
                  <th>Content</th>
                  <th>Type</th>
                  <th>Author</th>
                  <th>Views</th>
                  <th>Avg. Time Spent</th>
                  <th>Last Updated</th>
                </ContentTableHeader>
                <tbody>
                  {analyticsData?.contentPerformance && analyticsData.contentPerformance.length > 0 ? (
                    analyticsData.contentPerformance.map((content, index) => (
                      <ContentTableRow key={index}>
                        <td>{content.title}</td>
                        <td>
                          <TypeBadge type={content.type}>
                            {content.type}
                          </TypeBadge>
                        </td>
                        <td>{content.author}</td>
                        <td>{content.views}</td>
                        <td>{content.avgTimeSpent}</td>
                        <td>{new Date(content.lastUpdated).toLocaleDateString()}</td>
                      </ContentTableRow>
                    ))
                  ) : (
                    <ContentTableRow>
                      <td colSpan="6" style={{ textAlign: 'center' }}>No content data found</td>
                    </ContentTableRow>
                  )}
                </tbody>
              </ContentTable>
            </ContentStatsSection>
          </TabContent>
        );
        
      default:
        return <div>Select a tab to view analytics</div>;
    }
  };

  return (
    <Container>
      <Header>
        <PageTitle>Analytics Dashboard</PageTitle>
        <Controls>
          <TimeRangeSelector 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="year">This year</option>
          </TimeRangeSelector>
          
          <ExportButton onClick={handleExportData}>
            <FiDownload size={16} />
            <span>Export Data</span>
          </ExportButton>
        </Controls>
      </Header>

      <TabNav>
        <TabButton 
          active={activeTab === 'visitors'} 
          onClick={() => setActiveTab('visitors')}
        >
          <FiUsers size={16} />
          <span>Visitor Analytics</span>
        </TabButton>
        <TabButton 
          active={activeTab === 'activity'} 
          onClick={() => setActiveTab('activity')}
        >
          <FiBarChart2 size={16} />
          <span>User Activity</span>
        </TabButton>
        <TabButton 
          active={activeTab === 'content'} 
          onClick={() => setActiveTab('content')}
        >
          <FiFileText size={16} />
          <span>Content Analytics</span>
        </TabButton>
      </TabNav>

      {renderTabContent()}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
`;

const TimeRangeSelector = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3f51b5;
  }
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  color: #555;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const TabNav = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.active ? '#3f51b5' : '#555'};
  border-bottom: 2px solid ${props => props.active ? '#3f51b5' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #3f51b5;
  }
`;

const TabContent = styled.div`
  margin-top: 1.5rem;
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
  padding: 1rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ChartCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const ChartHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
`;

const ChartTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChartBody = styled.div`
  padding: 1.5rem;
  height: ${props => props.height || 'auto'};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const MetricCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  position: relative;
`;

const MetricIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => `${props.color}10`};
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
`;

const MetricContent = styled.div`
  flex: 1;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const MetricBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => props.positive ? '#e8f5e9' : '#ffebee'};
  color: ${props => props.positive ? '#2e7d32' : '#c62828'};
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
`;

const ActivityLogSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ActivityTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const ActivityTableHeader = styled.tr`
  background-color: #f5f5f5;
  
  th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: #555;
    border-bottom: 1px solid #eee;
  }
`;

const ActivityTableRow = styled.tr`
  border-bottom: 1px solid #eee;
  
  &:hover {
    background-color: #f9f9f9;
  }
  
  td {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: #333;
  }
`;

const ActionBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.action) {
      case 'CREATE':
        return `
          background-color: #e8f5e9;
          color: #2e7d32;
        `;
      case 'UPDATE':
        return `
          background-color: #fff8e1;
          color: #f57f17;
        `;
      case 'DELETE':
        return `
          background-color: #ffebee;
          color: #c62828;
        `;
      case 'VIEW':
        return `
          background-color: #e3f2fd;
          color: #1565c0;
        `;
      case 'LOGIN':
        return `
          background-color: #f3e5f5;
          color: #6a1b9a;
        `;
      default:
        return `
          background-color: #eeeeee;
          color: #616161;
        `;
    }
  }}
`;

const ContentStatsSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ContentTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const ContentTableHeader = styled.tr`
  background-color: #f5f5f5;
  
  th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: #555;
    border-bottom: 1px solid #eee;
  }
`;

const ContentTableRow = styled.tr`
  border-bottom: 1px solid #eee;
  
  &:hover {
    background-color: #f9f9f9;
  }
  
  td {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: #333;
  }
`;

const TypeBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.type) {
      case 'ARTICLE':
        return `
          background-color: #e3f2fd;
          color: #1565c0;
        `;
      case 'RESOURCE':
        return `
          background-color: #e8f5e9;
          color: #2e7d32;
        `;
      case 'EVENT':
        return `
          background-color: #fff8e1;
          color: #f57f17;
        `;
      case 'PROJECT':
        return `
          background-color: #f3e5f5;
          color: #6a1b9a;
        `;
      default:
        return `
          background-color: #eeeeee;
          color: #616161;
        `;
    }
  }}
`;

export default Analytics;
