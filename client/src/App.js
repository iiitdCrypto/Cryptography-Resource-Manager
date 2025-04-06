import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import GlobalStyle from './styles/GlobalStyle';
import theme from './styles/theme';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import Profile from './pages/Profile';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import AddResource from './pages/AddResource';
import EditResource from './pages/EditResource';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import EditUser from './pages/EditUser';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import Articles from './pages/Articles';
import Events from './pages/Events';
import About from './pages/About';

// Dashboard Components
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import UserManagement from './components/dashboard/UserManagement';
import Analytics from './components/dashboard/Analytics';
import ContentManagement from './components/dashboard/ContentManagement';
import DashboardEvents from './components/dashboard/Events';
import Professors from './components/dashboard/Professors';

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <AuthProvider>
          <Routes>
            {/* Dashboard Routes - No Navbar/Footer as DashboardLayout provides its own */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="users" element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } />
              <Route path="analytics" element={
                <AdminRoute>
                  <Analytics />
                </AdminRoute>
              } />
              <Route path="content" element={
                <AdminRoute>
                  <ContentManagement />
                </AdminRoute>
              } />
              <Route path="resources" element={<Dashboard />} />
              <Route path="events" element={<DashboardEvents />} />
              <Route path="professors" element={<Professors />} />
              <Route path="activity" element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              } />
              <Route path="settings" element={<Profile />} />
            </Route>
            
            {/* Regular Routes with Navbar and Footer */}
            <Route path="/" element={<>
              <Navbar />
              <main>
                <Home />
              </main>
              <Footer />
            </>} />
            
            <Route path="/articles" element={<>
              <Navbar />
              <main>
                <Articles />
              </main>
              <Footer />
            </>} />
            
            <Route path="/login" element={<>
              <Navbar />
              <main>
                <Login />
              </main>
              <Footer />
            </>} />
            
            <Route path="/register" element={<>
              <Navbar />
              <main>
                <Register />
              </main>
              <Footer />
            </>} />
            
            <Route path="/forgot-password" element={<>
              <Navbar />
              <main>
                <ForgotPassword />
              </main>
              <Footer />
            </>} />
            
            <Route path="/verify-email/:token" element={<>
              <Navbar />
              <main>
                <EmailVerification />
              </main>
              <Footer />
            </>} />
            
            <Route path="/reset-password/:token" element={<>
              <Navbar />
              <main>
                <ResetPassword />
              </main>
              <Footer />
            </>} />
            
            <Route path="/resources" element={<>
              <Navbar />
              <main>
                <Resources />
              </main>
              <Footer />
            </>} />
            
            <Route path="/resources/:id" element={<>
              <Navbar />
              <main>
                <ResourceDetail />
              </main>
              <Footer />
            </>} />
            
            <Route path="/profile" element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main>
                    <Profile />
                  </main>
                  <Footer />
                </>
              </PrivateRoute>
            } />
            
            <Route path="/resources/add" element={
              <AdminRoute>
                <>
                  <Navbar />
                  <main>
                    <AddResource />
                  </main>
                  <Footer />
                </>
              </AdminRoute>
            } />
            
            <Route path="/resources/edit/:id" element={
              <AdminRoute>
                <>
                  <Navbar />
                  <main>
                    <EditResource />
                  </main>
                  <Footer />
                </>
              </AdminRoute>
            } />
            
            <Route path="/admin/users" element={
              <AdminRoute>
                <>
                  <Navbar />
                  <main>
                    <Users />
                  </main>
                  <Footer />
                </>
              </AdminRoute>
            } />
            
            <Route path="/admin/users/edit/:id" element={
              <AdminRoute>
                <>
                  <Navbar />
                  <main>
                    <EditUser />
                  </main>
                  <Footer />
                </>
              </AdminRoute>
            } />
            
            <Route path="/events" element={<>
              <Navbar />
              <main>
                <Events />
              </main>
              <Footer />
            </>} />
            
            <Route path="/about" element={<>
              <Navbar />
              <main>
                <About />
              </main>
              <Footer />
            </>} />
            
            <Route path="*" element={<>
              <Navbar />
              <main>
                <NotFound />
              </main>
              <Footer />
            </>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
