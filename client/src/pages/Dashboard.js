import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHome from '../components/dashboard/DashboardHome';
import DashboardResources from '../components/dashboard/DashboardResources';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <DashboardContainer>
      <DashboardSidebar isOpen={isSidebarOpen} />
      <MainContent isSidebarOpen={isSidebarOpen}>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/resources" element={<DashboardResources />} />
        </Routes>
      </MainContent>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  display: flex;
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.backgroundLight};
  min-height: calc(100vh - 60px);
`;

export default Dashboard;