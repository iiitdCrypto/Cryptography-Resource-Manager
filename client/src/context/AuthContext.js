import React, { createContext, useState, useContext, useEffect } from 'react';
<<<<<<< HEAD
import { jwtDecode } from 'jwt-decode';
import authService from '../services/authService';

const AuthContext = createContext();

=======
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Changed to use named import with curly braces

const AuthContext = createContext();

// Define the API URL - let's check if we're using the correct URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

>>>>>>> 82939576ee37b12dba67578adf111e420d0654ac
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
<<<<<<< HEAD
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            authService.logout();
            setUser(null);
          } else {
            // Fetch fresh user data from the server
            const userData = await authService.getProfile();
            setUser(userData);
          }
        } catch (err) {
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
=======
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verify token expiration
        const decodedToken = jwtDecode(token); // Changed from jwt_decode to jwtDecode
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token expired
          localStorage.removeItem('token');
          setUser(null);
        } else {
          // Set user from token
          setUser({
            id: decodedToken.id,
            name: decodedToken.name || decodedToken.email.split('@')[0],
            email: decodedToken.email,
            role: decodedToken.role
          });
          
          // Set axios default header
          axios.defaults.headers.common['x-auth-token'] = token;
        }
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
>>>>>>> 82939576ee37b12dba67578adf111e420d0654ac
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Log the request for debugging
      console.log('Sending registration request with data:', {
        ...userData,
        password: '[REDACTED]' // Don't log the actual password
      });
      
      // Log the full URL for debugging
      const registrationUrl = `${API_URL}/auth/register`;
      console.log('Attempting to register at URL:', registrationUrl);
      
      // Try the registration
      const response = await axios.post(registrationUrl, userData);
      
      // Log the successful response
      console.log('Registration response:', response.data);
      
      return response.data;
    } catch (error) {
      // Enhanced error logging
      console.error('Registration error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        // Provide more helpful error messages based on status code
        if (error.response.status === 404) {
          // Try to check if the server is running at all by making a simple request
          try {
            console.log('Checking if server is running...');
            await axios.get(`${API_URL.split('/api')[0]}`);
            throw new Error('Registration endpoint not found. The server is running but the registration route is not available. Check your backend routes configuration.');
          } catch (serverError) {
            throw new Error('Backend server may not be running or the API URL is incorrect. Please check your server and API configuration.');
          }
        } else if (error.response.status === 409) {
          throw new Error('Email already exists. Please use a different email address.');
        } else {
          throw new Error(error.response.data.message || 'Registration failed. Please try again.');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response from server. Please check if your backend server is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        throw new Error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    try {
      setError(null);
      const res = await axios.get(`http://localhost:5001/api/auth/verify/${token}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Email verification failed');
      throw err;
    }
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      setError(null);
      setLoading(true);
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
      
      // If verification returns a token, save it
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        
        // Set axios default header
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        
        // Set user state if user data is returned
        if (res.data.user) {
          setUser(res.data.user);
        }
      }
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async (email) => {
    try {
      setError(null);
      setLoading(true);
      const res = await axios.post(`${API_URL}/auth/resend-otp`, { email });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Request password reset
  const forgotPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password with OTP
  const resetPassword = async (email, otp, newPassword) => {
    try {
      setError(null);
      setLoading(true);
      const res = await axios.post(`${API_URL}/auth/reset-password`, { 
        email, 
        otp, 
        password: newPassword 
      });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      // Save token to localStorage
      localStorage.setItem('token', res.data.token);
      
      // Set axios default header
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      
<<<<<<< HEAD
      // Set user state with the data from response
      setUser({
        id: res.data.id,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        email: res.data.email,
        role: res.data.role
      });
      
      return {
        ...res.data,
        user: {
          id: res.data.id,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          email: res.data.email,
          role: res.data.role
        }
      };
=======
      // Set user state with the user data from response
      setUser(res.data.user);
      
      return res.data;
>>>>>>> 82939576ee37b12dba67578adf111e420d0654ac
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    register,
    verifyEmail,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};