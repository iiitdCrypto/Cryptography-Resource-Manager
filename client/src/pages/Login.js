import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaEnvelope, FaLock, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    const { email, password } = formData;
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setLoginError('');
      
      try {
        await login(formData.email, formData.password);
        navigate('/');
      } catch (error) {
        setLoginError(error.response?.data?.message || 'Login failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <LoginContainer>
      <div className="container">
        <LoginCard>
          <LoginHeader>
            <LoginTitle>Welcome Back</LoginTitle>
            <LoginSubtitle>Sign in to your account</LoginSubtitle>
          </LoginHeader>
          
          {loginError && (
            <ErrorMessage>
              <FaExclamationCircle />
              <span>{loginError}</span>
            </ErrorMessage>
          )}
          
          <LoginForm onSubmit={handleSubmit}>
            <FormGroup>
              <FormLabel>Email</FormLabel>
              <InputWrapper>
                <InputIcon>
                  <FaEnvelope />
                </InputIcon>
                <FormInput
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  error={formErrors.email}
                />
              </InputWrapper>
              {formErrors.email && (
                <ErrorText>{formErrors.email}</ErrorText>
              )}
            </FormGroup>
            
            <FormGroup>
              <FormLabel>Password</FormLabel>
              <InputWrapper>
                <InputIcon>
                  <FaLock />
                </InputIcon>
                <FormInput
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                />
              </InputWrapper>
              {formErrors.password && (
                <ErrorText>{formErrors.password}</ErrorText>
              )}
            </FormGroup>
            
            <ForgotPassword to="/forgot-password">
              Forgot your password?
            </ForgotPassword>
            
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </SubmitButton>
          </LoginForm>
          
          <LoginFooter>
            <span>Don't have an account?</span>
            <RegisterLink to="/register">Sign Up</RegisterLink>
          </LoginFooter>
        </LoginCard>
      </div>
    </LoginContainer>
  );
};

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
  padding: 2rem 0;
`;

const LoginCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LoginTitle = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;

const LoginSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
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

const LoginForm = styled.form`
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid ${({ error, theme }) => error ? theme.colors.error : theme.colors.gray};
  border-radius: 5px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: ${({ error, theme }) => error ? theme.colors.error : theme.colors.primary};
  }
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const ForgotPassword = styled(Link)`
  display: block;
  text-align: right;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray};
    cursor: not-allowed;
  }
`;

const LoginFooter = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.textLight};
`;

const RegisterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  margin-left: 0.5rem;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default Login;