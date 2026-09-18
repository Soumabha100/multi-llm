import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatDashboard from './pages/ChatDashboard';
import SingleModelChat from './pages/SingleModelChat';
import NotFoundPage from './pages/NotFoundPage';
import FeaturesPage from './pages/FeaturesPage';
import GitHubPage from './pages/GitHubPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/github" element={<GitHubPage />} />

      {/* Protected Routes */}
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <ChatDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat/:sessionId" 
        element={
          <ProtectedRoute>
            <ChatDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat/:sessionId/model/:modelId" 
        element={
          <ProtectedRoute>
            <SingleModelChat />
          </ProtectedRoute>
        } 
      />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
