// client/src/App.jsx
import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/home';
import AuthPage from './pages/auth/AuthPage';
import AdminDashboard from './pages/admin/dashboard'
import CitizenDashboard from './pages/citizen/dashboard';
import WorkerDashboard from './pages/worker/dashboard';
import Forgot_password from './pages/auth/forgot_password';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const UnauthorizedPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>🚫 Unauthorized</h1>
    <p>You don't have permission to access this page.</p>
  </div>
);


function App() {
  return (
    <div>
      <AuthProvider>
        <Router>
          <div className="App">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  theme: {
                    primary: '#4aed88',
                  },
                },
                error: {
                  duration: 4000,
                  theme: {
                    primary: '#f56565',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              
              {/* Protected Routes */}
              <Route 
                path="/citizen" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/worker" 
                element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route path="/forgot-password" element={<Forgot_password />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
      <SpeedInsights />
      <Analytics />
    </div>
  );
}

export default App;