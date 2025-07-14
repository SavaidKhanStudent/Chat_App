import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './components/Login';
import Chat from './components/Chat';
import ProfileSetup from './components/ProfileSetup';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <div>Loading application...</div>; // Global loading state
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        
        <Route 
          path="/profile-setup"
          element={currentUser ? <ProfileSetup /> : <Navigate to="/login" />}
        />

        <Route 
          path="/chat/:chatId"
          element={<ProtectedRoute><Chat /></ProtectedRoute>}
        />

        <Route 
          path="/"
          element={<ProtectedRoute><Chat /></ProtectedRoute>}
        />

        {/* Fallback route: determines where to send user based on auth and profile status */}
        <Route path="*" element={<Navigate to={!currentUser ? "/login" : (userProfile?.profileSetupComplete ? "/" : "/profile-setup")} />} />
      </Routes>
    </Router>
  );
}

export default App;
