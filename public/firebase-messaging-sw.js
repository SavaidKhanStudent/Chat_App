// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// by passing in the messagingSenderId.
const firebaseConfig = {
  apiKey: "AIzaSyD9SReqrBCfiVJSsVKDvrE0f4uybnnCiAc",
  authDomain: "chatapp-427be.firebaseapp.com",
  projectId: "chatapp-427be",
  storageBucket: "chatapp-427be.firebasestorage.app",
  messagingSenderId: "391602298193",
  appId: "1:391602298193:web:1f9dac41db299331a68770"
};

febase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Optional: add an icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
