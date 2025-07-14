import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const currentUidRef = useRef(null); // Ref to hold the UID

  useEffect(() => {
    let profileUnsubscribe;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUidRef.current = user.uid; // Store UID in ref
        setCurrentUser(user);

        if (profileUnsubscribe) {
          profileUnsubscribe();
        }

        const userDocRef = doc(db, 'users', user.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data();
            setUserProfile(profileData);
            if (!profileData.online) {
              updateDoc(userDocRef, { online: true });
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });

        // Realtime Database presence management
        const userStatusDatabaseRef = ref(rtdb, `/status/${user.uid}`);
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

        // Use the UID from the ref to update status on sign-out
        if (currentUidRef.current) {
          const userRef = doc(db, 'users', currentUidRef.current);
          updateDoc(userRef, { online: false, lastSeen: serverTimestamp() }).catch(() => {});
          currentUidRef.current = null; // Clear the ref
        }

        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

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
