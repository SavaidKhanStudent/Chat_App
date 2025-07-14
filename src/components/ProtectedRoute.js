import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If the user profile is loaded and setup is not complete, redirect
  if (userProfile && userProfile.profileSetupComplete === false) {
    return <Navigate to="/profile-setup" />;
  }

  // If profile is complete, or still loading (to prevent flicker), show the chat
  return children;
};

export default ProtectedRoute;
