const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.deleteOldMessages = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async (context) => {
        console.log("Running daily old message cleanup...");
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const chatsRef = db.collection("chats");
        const chatsSnapshot = await chatsRef.get();

        let totalDeleted = 0;

        const deletionPromises = [];

        chatsSnapshot.forEach((chatDoc) => {
            const messagesRef = chatDoc.ref.collection("messages");
            const oldMessagesQuery = messagesRef.where("timestamp", "<", sevenDaysAgo);

            const promise = oldMessagesQuery.get().then((snapshot) => {
                if (snapshot.empty) {
                    return;
                }

                const batch = db.batch();
                snapshot.docs.forEach((doc) => {
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

