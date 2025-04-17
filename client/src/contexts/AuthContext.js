import axios from 'axios';

// Login user
const login = async (email, password) => {
  setLoading(true);
  setError(null);

  try {
    const response = await axios.post('/api/auth/login', { email, password });
    
    const userData = response.data;
    
    // Set user data and token
    setUser(userData);
    localStorage.setItem('token', userData.token);
    
    // Set permissions based on role
    setPermissions({
      canAccessDashboard: userData.canAccessDashboard || false
    });
    
    setLoading(false);
    return { success: true, redirectTo: userData.redirectTo || '/' };
  } catch (err) {
    // Try mock login as fallback in development mode
    if (err.response && err.response.status === 500 && process.env.NODE_ENV === 'development') {
      console.warn('Regular login failed, attempting mock login for development');
      try {
        const mockResponse = await axios.post('/api/auth/mock-login', { email, password });
        
        const userData = mockResponse.data;
        
        // Set user data and token
        setUser(userData);
        localStorage.setItem('token', userData.token);
        
        // Set permissions based on role
        setPermissions({
          canAccessDashboard: userData.canAccessDashboard || false
        });
        
        setLoading(false);
        return { success: true, redirectTo: userData.redirectTo || '/' };
      } catch (mockError) {
        console.error('Mock login also failed:', mockError);
        // Continue to regular error handling
      }
    }
    
    let errorMessage = 'Login failed';
    
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage = err.response.data.message || 'Invalid credentials';
    } else if (err.request) {
      // The request was made but no response was received
      errorMessage = 'Server not responding. Please try again later.';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    setLoading(false);
    return { success: false, error: errorMessage };
  }
}; 