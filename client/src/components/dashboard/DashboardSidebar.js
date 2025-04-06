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
  FaBook,
  FaHistory,
  FaCog,
  FaUserTie
} from 'react-icons/fa';
import { FiLogOut, FiActivity, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const DashboardSidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const isAuthorized = user?.role === 'authorised';

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <FaHome size={20} />,
      path: '/dashboard',
      access: true // Everyone with dashboard access can see this
    },
    {
      title: 'Users',
      icon: <FaUsers size={20} />,
      path: '/dashboard/users',
      access: isAdmin // Only admins
    },
    {
      title: 'Resources',
      icon: <FaFileAlt size={20} />,
      path: '/dashboard/resources',
      access: true // Everyone with dashboard access
    },
    {
      title: 'Events',
      icon: <FaCalendarAlt size={20} />,
      path: '/dashboard/events',
      access: true // Everyone with dashboard access
    },
    {
      title: 'Professors',
      icon: <FaUserTie size={20} />,
      path: '/dashboard/professors',
      access: true // Everyone with dashboard access
    },
    {
      title: 'Analytics',
      icon: <FaChartBar size={20} />,
      path: '/dashboard/analytics',
      access: isAdmin // Only admins
    },
    {
      title: 'Activity Logs',
      icon: <FiActivity size={20} />,
      path: '/dashboard/activity',
      access: isAdmin // Only admins
    },
    {
      title: 'Settings',
      icon: <FiSettings size={20} />,
      path: '/dashboard/settings',
      access: true // Everyone with dashboard access
    }
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

      <ProfileSection>
        <Avatar>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        {isOpen && (
          <ProfileInfo>
            <UserName>{user?.name || 'User'}</UserName>
            <UserRole>{user?.role || 'user'}</UserRole>
          </ProfileInfo>
        )}
      </ProfileSection>

      <MenuSection>
        {menuItems.map((item, index) => (
          item.access && (
            <MenuItem 
              key={index}
              to={item.path}
              isActive={location.pathname === item.path}
              isOpen={isOpen}
            >
              <MenuIcon>{item.icon}</MenuIcon>
              {isOpen && <MenuText>{item.title}</MenuText>}
            </MenuItem>
          )
        ))}
      </MenuSection>

      <LogoutButton onClick={logout}>
        <MenuIcon><FiLogOut size={20} /></MenuIcon>
        {isOpen && <MenuText>Logout</MenuText>}
      </LogoutButton>
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
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow-x: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const LogoContainer = styled.div`
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 15px;
`;

const Logo = styled.h1`
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  margin: 0;
  white-space: nowrap;
  letter-spacing: 0.5px;
`;

const LogoIcon = styled.h1`
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  margin: 0;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Avatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: #c5cae9;
  color: #1a237e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ProfileInfo = styled.div`
  margin-left: 12px;
  overflow: hidden;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: capitalize;
`;

const MenuSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  overflow-y: auto;
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: ${props => props.isOpen ? '14px 20px' : '14px 0'};
  justify-content: ${props => props.isOpen ? 'flex-start' : 'center'};
  color: ${props => props.isActive ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  background-color: ${props => props.isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border-left: ${props => props.isActive ? '4px solid white' : '4px solid transparent'};
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 4px;
  border-radius: 0 4px 4px 0;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    color: white;
  }
`;

const MenuIcon = styled.div`
  width: 40px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuText = styled.span`
  font-size: 15px;
  margin-left: 12px;
  white-space: nowrap;
  font-weight: 500;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  padding: 16px;
  background: none;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

export default DashboardSidebar;
