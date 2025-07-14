import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { db, app } from '../firebase';

const NotificationManager = ({ children }) => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      const messaging = getMessaging(app);

      // Request permission and get token
      const requestPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            // Get token
            const currentToken = await getToken(messaging, {
              vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE',
            });
            if (currentToken) {
              console.log('FCM Token:', currentToken);
              // Save the token to Firestore
              const userRef = doc(db, 'users', currentUser.uid);
              await setDoc(userRef, { fcmToken: currentToken }, { merge: true });
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          } else {
            console.log('Unable to get permission to notify.');
          }
        } catch (error) {
          console.error('An error occurred while retrieving token. ', error);
        }
      };

      requestPermission();

      // Handle foreground messages
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received in foreground. ', payload);
        // You can display a custom toast or notification here
        // For example: new Notification(payload.notification.title, { body: payload.notification.body });
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  return <>{children}</>;
};

export default NotificationManager;
