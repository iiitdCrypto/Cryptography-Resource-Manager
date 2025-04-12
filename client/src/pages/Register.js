import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaUser, FaEnvelope, FaLock, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import OtpVerification from '../components/auth/OtpVerification';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  
  const { register } = useAuth();
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
    const { name, surname, email, password, confirmPassword } = formData;
    
    if (!name.trim()) {
      errors.name = 'First name is required';
    }
    
    if (!surname.trim()) {
      errors.surname = 'Last name is required';
    }
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setRegisterError('');
      
      try {
        await register({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          password: formData.password
        });
        
        // If registration is successful, show OTP verification
        setShowOtpVerification(true);
      } catch (error) {
        setRegisterError(error.response?.data?.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleVerificationSuccess = (data) => {
    // When OTP verification is successful
    setRegistrationSuccess(true);
    setShowOtpVerification(false);
    
    // If token is provided, store it and navigate to dashboard
    if (data?.token) {
      localStorage.setItem('token', data.token);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };
  
  if (showOtpVerification) {
    return (
      <RegisterContainer>
        <div className="container">
          <RegisterCard>
            <RegisterHeader>
              <RegisterTitle>Verify Your Email</RegisterTitle>
              <RegisterSubtitle>We've sent a verification code to your email</RegisterSubtitle>
            </RegisterHeader>
            <OtpVerification 
              email={formData.email} 
              onSuccess={handleVerificationSuccess} 
            />
          </RegisterCard>
        </div>
      </RegisterContainer>
    );
  }
  
  if (registrationSuccess) {
    return (
      <RegisterContainer>
        <div className="container">
          <SuccessCard>
            <SuccessIcon>
              <FaCheckCircle />
            </SuccessIcon>
            <SuccessTitle>Registration Successful!</SuccessTitle>
            <SuccessMessage>
              A verification email has been sent to <strong>{formData.email}</strong>.
              Please check your inbox and click the verification link to activate your account.
            </SuccessMessage>
            <SuccessActions>
              <PrimaryButton onClick={() => navigate('/login')}>
                Go to Login
              </PrimaryButton>
              <SecondaryButton as="a" href={`mailto:${formData.email}`}>
                Open Email App
              </SecondaryButton>
            </SuccessActions>
          </SuccessCard>
        </div>
      </RegisterContainer>
    );
  }
  
  return (
    <RegisterContainer>
      <div className="container">
        <RegisterCard>
          <RegisterHeader>
            <RegisterTitle>Create Account</RegisterTitle>
            <RegisterSubtitle>Join our cryptography community</RegisterSubtitle>
          </RegisterHeader>
          
          {registerError && (
            <ErrorMessage>
              <FaExclamationCircle />
              <span>{registerError}</span>
            </ErrorMessage>
          )}
          
          <RegisterForm onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup>
                <FormLabel>First Name</FormLabel>
                <InputWrapper>
                  <InputIcon>
                    <FaUser />
                  </InputIcon>
                  <FormInput
                    type="text"
                    name="name"
                    placeholder="Enter your first name"
                    value={formData.name}
                    onChange={handleChange}
                    error={formErrors.name}
                  />
                </InputWrapper>
                {formErrors.name && (
                  <ErrorText>{formErrors.name}</ErrorText>
                )}
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Last Name</FormLabel>
                <InputWrapper>
                  <InputIcon>
                    <FaUser />
                  </InputIcon>
                  <FormInput
                    type="text"
                    name="surname"
                    placeholder="Enter your last name"
                    value={formData.surname}
                    onChange={handleChange}
                    error={formErrors.surname}
                  />
                </InputWrapper>
                {formErrors.surname && (
                  <ErrorText>{formErrors.surname}</ErrorText>
                )}
              </FormGroup>
            </FormRow>
            
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
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                />
              </InputWrapper>
              {formErrors.password && (
                <ErrorText>{formErrors.password}</ErrorText>
              )}
            </FormGroup>
            
            <FormGroup>
              <FormLabel>Confirm Password</FormLabel>
              <InputWrapper>
                <InputIcon>
                  <FaLock />
                </InputIcon>
                <FormInput
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={formErrors.confirmPassword}
                />
              </InputWrapper>
              {formErrors.confirmPassword && (
                <ErrorText>{formErrors.confirmPassword}</ErrorText>
              )}
            </FormGroup>
            
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </SubmitButton>
          </RegisterForm>
          
          <RegisterFooter>
            <span>Already have an account?</span>
            <LoginLink to="/login">Sign In</LoginLink>
          </RegisterFooter>
        </RegisterCard>
      </div>
    </RegisterContainer>
  );
};

const RegisterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
  padding: 2rem 0;
`;

const RegisterCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const RegisterHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const RegisterTitle = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;

const RegisterSubtitle = styled.p`
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

const RegisterForm = styled.form`
  margin-bottom: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
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

const RegisterFooter = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.textLight};
`;

const LoginLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  margin-left: 0.5rem;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SuccessCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: 3rem 2rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
`;

const SuccessIcon = styled.div`
  font-size: 4rem;
  color: ${({ theme }) => theme.colors.success};
  margin-bottom: 1.5rem;
`;

const SuccessTitle = styled.h2`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const SuccessActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: center;
  }
`;

const PrimaryButton = styled.button`
  padding: 0.8rem 2rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-3px);
  }
`;

const SecondaryButton = styled.button`
  padding: 0.8rem 2rem;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    transform: translateY(-3px);
  }
`;

export default Register;