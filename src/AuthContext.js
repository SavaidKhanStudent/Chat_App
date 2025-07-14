import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, rtdb } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe; // To hold the onSnapshot unsubscribe function

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // Clean up any previous profile listener
        if (profileUnsubscribe) {
          profileUnsubscribe();
        }

        const userDocRef = doc(db, 'users', user.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data();
            setUserProfile(profileData);
            // Update online status if needed
            if (!profileData.online) {
              updateDoc(userDocRef, { online: true });
            }
          } else {
            setUserProfile(null); // User document doesn't exist yet
          }
          setLoading(false);
        });

        // Realtime Database presence management
        const userStatusDatabaseRef = ref(rtdb, '/status/' + user.uid);
        const isOfflineForDatabase = { state: 'offline', last_changed: rtdbServerTimestamp() };
        const isOnlineForDatabase = { state: 'online', last_changed: rtdbServerTimestamp() };

        onValue(ref(rtdb, '.info/connected'), (snapshot) => {
          if (snapshot.val() === false) return;
          onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            set(userStatusDatabaseRef, isOnlineForDatabase);
            const userStatusFirestoreRef = doc(db, 'users', user.uid);
            onDisconnect(userStatusFirestoreRef).update({ online: false, lastSeen: serverTimestamp() });
          });
        });

      } else {
        // User is signed out
        if (profileUnsubscribe) profileUnsubscribe();
        if (currentUser) {
            const userRef = doc(db, 'users', currentUser.uid);
            updateDoc(userRef, { online: false, lastSeen: serverTimestamp() }).catch(() => {});
        }
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Cleanup function for the useEffect hook
    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []); // Run only once on mount

  const value = {
    currentUser,
    userProfile, // Expose the full Firestore profile
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
