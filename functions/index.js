const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.sendPushNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notificationData = snap.data();
    const { recipientUid, senderName, message } = notificationData;

    const userDoc = await admin.firestore().collection('users').doc(recipientUid).get();
    if (!userDoc.exists) {
      console.log(`User document for UID ${recipientUid} not found.`);
      return;
    }

    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) {
      console.log(`FCM token for user ${recipientUid} not found.`);
      return;
    }

    const payload = {
      notification: {
        title: `New message from ${senderName}`,
        body: message,
        icon: '/favicon.ico',
      },
      token: fcmToken,
    };

        try {
      const response = await admin.messaging().send(payload);
      console.log('Successfully sent message:', response);
      return snap.ref.delete();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

exports.deleteOldMessages = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Running daily old message cleanup...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chatsRef = db.collection('chats');
    const chatsSnapshot = await chatsRef.get();

    let totalDeleted = 0;

    const deletionPromises = [];

    chatsSnapshot.forEach(chatDoc => {
      const messagesRef = chatDoc.ref.collection('messages');
      const oldMessagesQuery = messagesRef.where('timestamp', '<', sevenDaysAgo);
      
      const promise = oldMessagesQuery.get().then(snapshot => {
        if (snapshot.empty) {
          return;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        totalDeleted += snapshot.size;
        return batch.commit();
      });

      deletionPromises.push(promise);
    });

    await Promise.all(deletionPromises);
    console.log(`Cleanup complete. Deleted ${totalDeleted} old messages.`);
    return null;
  });
