import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth } from '../AuthContext';
import './ProfileSetup.css';

const ProfileSetup = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (displayName.trim().length < 3) {
      setError('Display name must be at least 3 characters long.');
      return;
    }
    if (!currentUser) {
      setError('No user is logged in.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const newName = displayName.trim();

      // Update both Auth and Firestore
      await Promise.all([
        updateProfile(auth.currentUser, { displayName: newName }),
        updateDoc(userDocRef, {
          displayName: newName,
          profileSetupComplete: true,
        }),
      ]);

      navigate('/'); // Redirect to chat on success
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error('Profile setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-overlay">
      <div className="profile-setup-modal">
        <h2>Set Up Your Profile</h2>
        <p>This name will be visible to other users.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            disabled={loading}
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
