import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, rtdb } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Start with loading true
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user);
      if (user) {
                        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);

                if (!docSnap.exists()) {
          console.log('User document does not exist. Prompting for profile setup.');
          setIsNewUser(true);
        } else {
          console.log('User document found. Setting as existing user.');
          setIsNewUser(false);
          // Existing user, update online status
          await updateDoc(userDocRef, { online: true });
        }

        setCurrentUser(user);

        // Realtime Database presence
        const userStatusDatabaseRef = ref(rtdb, '/status/' + user.uid);
        const isOfflineForDatabase = {
          state: 'offline',
          last_changed: rtdbServerTimestamp(),
        };
        const isOnlineForDatabase = {
          state: 'online',
          last_changed: rtdbServerTimestamp(),
        };

        onValue(ref(rtdb, '.info/connected'), (snapshot) => {
          if (snapshot.val() === false) {
            return;
          }
          onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            set(userStatusDatabaseRef, isOnlineForDatabase);

            // Also update Firestore on disconnect
            const userStatusFirestoreRef = doc(db, 'users', user.uid);
            onDisconnect(userStatusFirestoreRef).update({ 
              online: false, 
              lastSeen: serverTimestamp() 
            });
          });
        });

      } else {
        // User is signed out.
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, { online: false, lastSeen: serverTimestamp() }, { merge: true });
                  // RTDB offline status is handled by onDisconnect
        }
                console.log('User is signed out.');
        setCurrentUser(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });

        return unsubscribe;
  }, []);

    const handleProfileComplete = () => {
    setIsNewUser(false);
  };

    const value = {
    currentUser,
    isNewUser,
    loading, // Expose loading state
    handleProfileComplete
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
