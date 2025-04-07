import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FaHome, 
  FaUsers, 
  FaChartBar, 
  FaFileAlt, 
  FaCalendarAlt,
  FaUserTie
} from 'react-icons/fa';
import { FiSettings } from 'react-icons/fi';

const DashboardContent = () => {
  const location = useLocation();
  
  if (location.pathname === '/dashboard') {
    return (
      <WelcomeSection>
        <h1>Welcome to Cryptography Resource Manager Dashboard</h1>
        <UserManual>
          <h2>User Manual</h2>
          <ManualSection>
            <h3>Resources</h3>
            <p>Browse, add, update, or remove cryptography learning materials, documents, and resources. You can manage files, links, and educational content.</p>
          </ManualSection>
          <ManualSection>
            <h3>Users</h3>
            <p>Manage user accounts, permissions, and access levels. Add new users, update profiles, or remove existing users from the system.</p>
          </ManualSection>
          <ManualSection>
            <h3>Events</h3>
            <p>Schedule and manage cryptography-related events, workshops, and meetings. Create new events, update details, or cancel existing events.</p>
          </ManualSection>
          <ManualSection>
            <h3>Professors</h3>
            <p>Manage professor profiles and their associated courses. Add new professors, update their information, or remove them from the system.</p>
          </ManualSection>
        </UserManual>
      </WelcomeSection>
    );
  }
  return null;
};

const DashboardSidebar = ({ isOpen }) => {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <FaHome size={20} />,
      path: '/dashboard'
    },
    {
      title: 'Users',
      icon: <FaUsers size={20} />,
      path: '/dashboard/users'
    },
    {
      title: 'Resources',
      icon: <FaFileAlt size={20} />,
      path: '/dashboard/resources'
    },
    {
      title: 'Events',
      icon: <FaCalendarAlt size={20} />,
      path: '/dashboard/events'
    },
    {
      title: 'Professors',
      icon: <FaUserTie size={20} />,
      path: '/dashboard/professors'
    },
    // {
    //   title: 'Analytics',
    //   icon: <FaChartBar size={20} />,
    //   path: '/dashboard/analytics'
    // },
    // {
    //   title: 'Settings',
    //   icon: <FiSettings size={20} />,
    //   path: '/dashboard/settings'
    // }
  ];

  return (
    <SidebarContainer
      initial={false}
      animate={{
        width: isOpen ? '300px' : '80px'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <LogoContainer>
        {isOpen ? (
          <Logo>Crypto Resources</Logo>
        ) : (
          <LogoIcon>CR</LogoIcon>
        )}
      </LogoContainer>

      <MenuSection>
        {menuItems.map((item, index) => (
          <MenuItem 
            key={index}
            to={item.path}
            isActive={location.pathname === item.path}
            isOpen={isOpen}
          >
            <MenuIcon>{item.icon}</MenuIcon>
            {isOpen && <MenuText>{item.title}</MenuText>}
          </MenuItem>
        ))}
      </MenuSection>
    </SidebarContainer>
  );
};

const SidebarContainer = styled(motion.div)`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  background-color: #1a237e;
  color: white;
  padding: 1rem;
  overflow-x: hidden;
  z-index: 100;
`;

const LogoContainer = styled.div`
  padding: 1rem 0;
  margin-bottom: 2rem;
  text-align: center;
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
`;

const LogoIcon = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
`;

const MenuSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: ${({ isActive }) => (isActive ? 'white' : 'rgba(255, 255, 255, 0.7)')};
  background-color: ${({ isActive }) => (isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent')};
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const MenuIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

const MenuText = styled.span`
  margin-left: 1rem;
  font-size: 1rem;
`;

const WelcomeSection = styled.div`
  padding: 2rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 2rem;
`;

const UserManual = styled.div`
  margin-top: 2rem;
`;

const ManualSection = styled.div`
  margin-bottom: 1.5rem;
`;

export default DashboardSidebar;
export { DashboardContent };
