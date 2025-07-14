import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './ProfileSetup.css';

const ProfileSetup = ({ user, onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (displayName.trim() === '') {
      setError('Please enter a name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: displayName.trim(),
        email: user.email,
        photoURL: user.photoURL,
        online: true,
        createdAt: serverTimestamp(),
      });
      onComplete();
    } catch (err) {
      setError('Failed to save name. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-overlay">
      <div className="profile-setup-modal">
        <h2>Welcome! What's your name?</h2>
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
