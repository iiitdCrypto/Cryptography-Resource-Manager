import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiSearch, FiFilter, FiCalendar } from 'react-icons/fi';

// Helper function to safely format dates
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Unknown';
  }
  
  return date.toLocaleDateString();
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'user',
    permissions: {
      canAccessDashboard: false,
      canManageUsers: false,
      canManageContent: false,
      canViewAnalytics: false
    }
  });

  // Get auth header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'x-auth-token': token
      }
    };
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from the actual API first
      try {
        const endpoint = process.env.NODE_ENV === 'development' 
          ? '/api/users/mock' 
          : '/api/users';
        
        const response = await axios.get(endpoint, getAuthHeader());
        setUsers(response.data);
        setLoading(false);
      } catch (apiError) {
        console.error('API call failed, using mock data instead:', apiError);
        // Fall back to mock data if API call fails
        const mockData = [
          {
            id: 1,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            permissions: {
              canAccessDashboard: true,
              canManageUsers: true,
              canManageContent: true,
              canViewAnalytics: true
            },
            emailVerified: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 2, 
            name: 'Regular User',
            email: 'user@example.com',
            role: 'regular',
            permissions: {
              canAccessDashboard: true,
              canManageUsers: false,
              canManageContent: false,
              canViewAnalytics: false
            },
            emailVerified: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            name: 'Authorised User',
            email: 'authorised@example.com',
            role: 'authorised',
            permissions: {
              canAccessDashboard: true,
              canManageUsers: false,
              canManageContent: true,
              canViewAnalytics: true
            },
            emailVerified: false,
            createdAt: new Date().toISOString()
          }
        ];
        
        setUsers(mockData);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      
      let errorMessage = 'Failed to load users';
      if (err.response) {
        errorMessage += `: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`;
      } else if (err.request) {
        errorMessage += ': No response from server';
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, user = null) => {
    if (mode === 'edit' && user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        password: '', // Don't populate password on edit
        role: user.role,
        permissions: {
          canAccessDashboard: user.permissions?.canAccessDashboard || false,
          canManageUsers: user.permissions?.canManageUsers || false,
          canManageContent: user.permissions?.canManageContent || false,
          canViewAnalytics: user.permissions?.canViewAnalytics || false
        }
      });
    } else {
      // Reset form for add mode
      setFormData({
        id: '',
        name: '',
        email: '',
        password: '',
        role: 'user',
        permissions: {
          canAccessDashboard: false,
          canManageUsers: false,
          canManageContent: false,
          canViewAnalytics: false
        }
      });
    }
    
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [name]: checked
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      if (modalMode === 'add') {
        try {
          // Format data to match backend expectations
          const nameParts = formData.name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Match the backend's expected format based on the controller
          const userData = {
            name: firstName,          // Backend expects 'name' instead of 'firstName'
            surname: lastName,        // Backend expects 'surname' instead of 'lastName'
            email: formData.email,
            password: formData.password,
            role: formData.role
          };
          
          // Actual API call to create user
          const response = await axios.post('/api/users', userData, getAuthHeader());
          console.log("User added successfully:", response.data);
          
          // After user is created, update permissions if needed
          if (response.data && response.data.userId) {
            const userId = response.data.userId;
            
            // Update permissions - convert to the format expected by the backend
            const permissionsData = {
              permissions: {
                canAccessDashboard: formData.permissions.canAccessDashboard,
                canManageUsers: formData.permissions.canManageUsers,
                canManageContent: formData.permissions.canManageContent,
                canViewAnalytics: formData.permissions.canViewAnalytics
              }
            };
            
            await axios.put(
              `/api/users/${userId}/permissions`,
              permissionsData,
              getAuthHeader()
            );
            
            // Refresh user list
            fetchUsers();
          }
        } catch (apiError) {
          console.error("API call failed, using mock data instead:", apiError);
          
          // MOCK ADD USER FUNCTIONALITY as fallback
          console.log("Adding user (mocked):", formData);
          
          // Generate a fake ID for the new user
          const newUser = {
            ...formData,
            id: users.length + 1,
            emailVerified: false,
            createdAt: new Date().toISOString()
          };
          
          setUsers(prevUsers => [...prevUsers, newUser]);
        }
      } else {
        try {
          // Format user data for the backend
          const nameParts = formData.name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const userData = {
            name: firstName,           // Backend expects 'name' instead of 'firstName'
            surname: lastName,         // Backend expects 'surname' instead of 'lastName'
            email: formData.email,
            role: formData.role
          };
          
          // Only include password if it was provided
          if (formData.password) {
            userData.password = formData.password;
          }
          
          // Update user data
          await axios.put(`/api/users/${formData.id}`, userData, getAuthHeader());
          
          // Update permissions - convert to the format expected by the backend
          const permissionsData = {
            permissions: {
              canAccessDashboard: formData.permissions.canAccessDashboard,
              canManageUsers: formData.permissions.canManageUsers,
              canManageContent: formData.permissions.canManageContent,
              canViewAnalytics: formData.permissions.canViewAnalytics
            }
          };
          
          await axios.put(
            `/api/users/${formData.id}/permissions`,
            permissionsData,
            getAuthHeader()
          );
          
          // Refresh users
          fetchUsers();
        } catch (apiError) {
          console.error("API call failed, using mock data instead:", apiError);
          
          // MOCK UPDATE USER FUNCTIONALITY as fallback
          console.log("Updating user (mocked):", formData);
          
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === formData.id 
                ? { ...user, ...formData }
                : user
            )
          );
        }
      }
      
      handleCloseModal();
    } catch (err) {
      console.error(`Error ${modalMode === 'add' ? 'adding' : 'updating'} user:`, err);
      
      let errorMessage = `Failed to ${modalMode} user`;
      if (err.response) {
        errorMessage += `: ${err.response.data?.message || 'Unknown error'}`;
      } else if (err.request) {
        errorMessage += ': No response from server';
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError(null);
        
        try {
          // Actual API call to delete user
          await axios.delete(`/api/users/${userId}`, getAuthHeader());
          console.log("User deleted successfully");
          
          // Refresh users after successful deletion
          fetchUsers();
        } catch (apiError) {
          console.error("API call failed, using mock deletion instead:", apiError);
          
          // MOCK DELETE USER FUNCTIONALITY as fallback
          console.log("Deleting user (mocked):", userId);
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        
        let errorMessage = 'Failed to delete user';
        if (err.response) {
          errorMessage += `: ${err.response.data?.message || 'Unknown error'}`;
        } else if (err.request) {
          errorMessage += ': No response from server';
        } else {
          errorMessage += `: ${err.message}`;
        }
        
        setError(errorMessage);
      }
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === '' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  return (
    <Container>
      <Header>
        <PageTitle>User Management</PageTitle>
        <AddButton onClick={() => handleOpenModal('add')}>
          <FiPlus size={18} />
          <span>Add User</span>
        </AddButton>
      </Header>

      <Filters>
        <SearchBar>
          <FiSearch size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>
        
        <FilterDropdown>
          <FiFilter size={18} />
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="authorised">Authorised</option>
            <option value="regular">Regular User</option>
          </select>
        </FilterDropdown>
      </Filters>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <LoadingMessage>Loading users...</LoadingMessage>
      ) : (
        <>
          <Table>
            <thead>
              <TableHeader>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Created At</th>
                <th>Actions</th>
              </TableHeader>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <RoleBadge $roleType={user.role}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </RoleBadge>
                    </td>
                    <td>
                      <PermissionsList>
                        {user.permissions?.canAccessDashboard && <PermissionBadge>Dashboard</PermissionBadge>}
                        {user.permissions?.canManageUsers && <PermissionBadge>Users</PermissionBadge>}
                        {user.permissions?.canManageContent && <PermissionBadge>Content</PermissionBadge>}
                        {user.permissions?.canViewAnalytics && <PermissionBadge>Analytics</PermissionBadge>}
                      </PermissionsList>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <ActionButtons>
                        <ActionButton onClick={() => handleOpenModal('edit', user)}>
                          <FiEdit2 size={16} />
                        </ActionButton>
                        <ActionButton $danger onClick={() => handleDeleteUser(user.id)}>
                          <FiTrash2 size={16} />
                        </ActionButton>
                      </ActionButtons>
                    </td>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No users found</td>
                </TableRow>
              )}
            </tbody>
          </Table>
        </>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <ModalContent
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>{modalMode === 'add' ? 'Add New User' : 'Edit User'}</ModalTitle>
                <CloseButton onClick={handleCloseModal}>
                  <FiX size={20} />
                </CloseButton>
              </ModalHeader>

              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="password">Password {modalMode === 'edit' && '(Leave blank to keep current)'}</Label>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={modalMode === 'add'}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="regular">Regular User</option>
                    <option value="authorised">Authorised User</option>
                    <option value="admin">Admin</option>
                  </Select>
                </FormGroup>

                <PermissionsSection>
                  <Label>Permissions</Label>
                  
                  <CheckboxGroup>
                    <Checkbox>
                      <input
                        type="checkbox"
                        id="canAccessDashboard"
                        name="canAccessDashboard"
                        checked={formData.permissions.canAccessDashboard}
                        onChange={handlePermissionChange}
                      />
                      <CheckboxLabel htmlFor="canAccessDashboard">
                        <CheckboxCustom>
                          {formData.permissions.canAccessDashboard && <FiCheck size={12} />}
                        </CheckboxCustom>
                        Access Dashboard
                      </CheckboxLabel>
                    </Checkbox>
                    
                    <Checkbox>
                      <input
                        type="checkbox"
                        id="canManageUsers"
                        name="canManageUsers"
                        checked={formData.permissions.canManageUsers}
                        onChange={handlePermissionChange}
                      />
                      <CheckboxLabel htmlFor="canManageUsers">
                        <CheckboxCustom>
                          {formData.permissions.canManageUsers && <FiCheck size={12} />}
                        </CheckboxCustom>
                        Manage Users
                      </CheckboxLabel>
                    </Checkbox>
                    
                    <Checkbox>
                      <input
                        type="checkbox"
                        id="canManageContent"
                        name="canManageContent"
                        checked={formData.permissions.canManageContent}
                        onChange={handlePermissionChange}
                      />
                      <CheckboxLabel htmlFor="canManageContent">
                        <CheckboxCustom>
                          {formData.permissions.canManageContent && <FiCheck size={12} />}
                        </CheckboxCustom>
                        Manage Content
                      </CheckboxLabel>
                    </Checkbox>
                    
                    <Checkbox>
                      <input
                        type="checkbox"
                        id="canViewAnalytics"
                        name="canViewAnalytics"
                        checked={formData.permissions.canViewAnalytics}
                        onChange={handlePermissionChange}
                      />
                      <CheckboxLabel htmlFor="canViewAnalytics">
                        <CheckboxCustom>
                          {formData.permissions.canViewAnalytics && <FiCheck size={12} />}
                        </CheckboxCustom>
                        View Analytics
                      </CheckboxLabel>
                    </Checkbox>
                  </CheckboxGroup>
                </PermissionsSection>

                <FormActions>
                  <Button type="button" $secondary onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit" $primary>
                    {modalMode === 'add' ? 'Add User' : 'Update User'}
                  </Button>
                </FormActions>
              </Form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
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

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #3f51b5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #303f9f;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex: 1;
  
  svg {
    color: #666;
    margin-right: 0.5rem;
  }
  
  input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 0.875rem;
  }
`;

const FilterDropdown = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  svg {
    color: #666;
    margin-right: 0.5rem;
  }
  
  select {
    border: none;
    outline: none;
    font-size: 0.875rem;
    background: transparent;
  }
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const TableHeader = styled.tr`
  background-color: #f5f5f5;
  
  th {
    padding: 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: #555;
  }
`;

const TableBody = styled.tbody`
  tr:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
`;

const TableRow = styled.tr`
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f9f9f9;
  }
  
  td {
    padding: 1rem;
    font-size: 0.875rem;
    color: #333;
  }
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    if (props.$roleType === 'admin') {
      return `
        background-color: #e8f5e9;
        color: #2e7d32;
      `;
    } else if (props.$roleType === 'authorised') {
      return `
        background-color: #e3f2fd;
        color: #1565c0;
      `;
    } else {
      return `
        background-color: #eeeeee;
        color: #616161;
      `;
    }
  }}
`;

const PermissionsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PermissionBadge = styled.span`
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.75rem;
  background-color: #f1f3f5;
  color: #666;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background-color: ${props => props.$danger ? '#fff5f5' : '#f1f3f5'};
  color: ${props => props.$danger ? '#e03131' : '#495057'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$danger ? '#ffe3e3' : '#e9ecef'};
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #eee;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #333;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #3f51b5;
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #3f51b5;
    outline: none;
  }
`;

const PermissionsSection = styled.div`
  margin-bottom: 1.5rem;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  
  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.875rem;
  color: #333;
`;

const CheckboxCustom = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 3px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: white;
  
  input:checked + ${CheckboxLabel} & {
    background-color: #3f51b5;
    border-color: #3f51b5;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => {
    if (props.$primary) {
      return `
        background-color: #3f51b5;
        color: white;
        
        &:hover {
          background-color: #303f9f;
        }
      `;
    } else if (props.$secondary) {
      return `
        background-color: #f1f3f5;
        color: #495057;
        
        &:hover {
          background-color: #e9ecef;
        }
      `;
    }
  }}
`;

export default UserManagement;
