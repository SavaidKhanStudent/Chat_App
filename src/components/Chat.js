import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaUserFriends, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { BsCheck, BsCheck2All } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import Message from './Message';
import './Chat.css';

const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Never';
  // Using date-fns for human-readable time
  return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
};

const Chat = () => {
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
  };
  const navigate = useNavigate();
  const { chatId: friendUid } = useParams(); // Renaming for clarity
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState({});
    const [isTabVisible, setIsTabVisible] = useState(document.visibilityState === 'visible');
    const [tick, setTick] = useState(0); // For re-rendering to update timestamps
    const [replyingTo, setReplyingTo] = useState(null);
  const [deletedForMe, setDeletedForMe] = useState(() => {
    const saved = localStorage.getItem(`deletedMessages_${currentUser?.uid}`);
    return saved ? JSON.parse(saved) : [];
  });
  const scrollRef = useRef();

      const getChatId = useCallback((uid1, uid2) => {
    if (!uid1 || !uid2) return null;
        return [uid1, uid2].sort().join('_');
  }, []);

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const getMessageById = (id) => {
      return messages.find(m => m.id === id);
  };

  const handleEditMessage = async (messageId, newText) => {
    const chatId = getChatId(currentUser.uid, friendUid);
    const msgRef = doc(db, `chats/${chatId}/messages`, messageId);
    await updateDoc(msgRef, {
      text: newText,
      edited: true
    });
  };

  const handleDeleteMessage = async (messageId, type) => {
    if (type === 'everyone') {
      const chatId = getChatId(currentUser.uid, friendUid);
      const msgRef = doc(db, `chats/${chatId}/messages`, messageId);
      await updateDoc(msgRef, {
        text: 'This message was deleted',
        deleted: true,
        replyTo: null, // Clear reply context
        edited: false // Clear edited status
      });
    } else if (type === 'me') {
      const newDeletedForMe = [...deletedForMe, messageId];
      setDeletedForMe(newDeletedForMe);
      localStorage.setItem(`deletedMessages_${currentUser.uid}`, JSON.stringify(newDeletedForMe));
    }
  };

  const formatSeenAt = (timestamp) => {
    if (!timestamp) return '';
    return `Seen at ${timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

    // Tab visibility listener
  useEffect(() => {
    const handleVisibilityChange = () => setIsTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Timer to update relative timestamps every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Mark messages as seen when tab becomes visible
  useEffect(() => {
    if (isTabVisible && messages.length > 0 && currentUser && friendUid) {
      const unreadMessages = messages.filter(msg => msg.senderId === friendUid && !msg.seen);
      if (unreadMessages.length > 0) {
        const batch = writeBatch(db);
        const chatId = getChatId(currentUser.uid, friendUid);
        unreadMessages.forEach(msg => {
          const msgRef = doc(db, `chats/${chatId}/messages`, msg.id);
          batch.update(msgRef, { seen: true, seenAt: serverTimestamp() });
        });
        batch.commit();
      }
    }
  }, [isTabVisible, messages, currentUser, friendUid, getChatId]);

  // Messages listener for private chat
  useEffect(() => {
    if (!friendUid || !currentUser) {
      setMessages([]);
      return;
    }

    const chatId = getChatId(currentUser.uid, friendUid);
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(newMessages);

      const batch = writeBatch(db);
      let batchHasWrites = false;

      // Mark messages as delivered
      const undeliveredMessages = snapshot.docs.filter(doc => doc.data().senderId === friendUid && !doc.data().delivered);
      if (undeliveredMessages.length > 0) {
        undeliveredMessages.forEach(doc => {
          batch.update(doc.ref, { delivered: true });
        });
        batchHasWrites = true;
      }

      // Mark messages as seen if tab is visible
      if (isTabVisible) {
        const unreadMessages = snapshot.docs.filter(doc => doc.data().senderId === friendUid && !doc.data().seen);
        if (unreadMessages.length > 0) {
          unreadMessages.forEach(doc => {
            batch.update(doc.ref, { seen: true, seenAt: serverTimestamp() });
          });
          batchHasWrites = true;
        }
      }

      if (batchHasWrites) {
        batch.commit();
      }
    });

        return unsubscribe;
  }, [currentUser, friendUid, isTabVisible, getChatId]);

  // Users presence listener
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = {};
      snapshot.forEach(doc => {
        usersData[doc.id] = doc.data();
      });
      setUsers(usersData);
    });
    return unsubscribe;
  }, []);

  // Set user presence and onChatPage status
  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);

    // Set online and on chat page
    setDoc(userRef, { 
      online: true, 
      onChatPage: true,
      lastSeen: serverTimestamp(),
      displayName: currentUser.displayName || currentUser.email
    }, { merge: true });

    const handleBeforeUnload = () => {
      setDoc(userRef, { online: false, onChatPage: false, lastSeen: serverTimestamp() }, { merge: true });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // User is leaving the chat page, but not necessarily offline
      setDoc(userRef, { onChatPage: false, lastSeen: serverTimestamp() }, { merge: true });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser || !friendUid) return;

    const chatId = getChatId(currentUser.uid, friendUid);
    const messagesCol = collection(db, `chats/${chatId}/messages`);

            await addDoc(messagesCol, {
      text: newMessage,
      senderId: currentUser.uid,
      senderName: users[currentUser.uid]?.displayName || 'Anonymous',
      timestamp: serverTimestamp(),
      delivered: false,
      seen: false,
      seenAt: null,
      replyTo: replyingTo ? replyingTo.id : null
    });

    // Optional: Trigger notification for the other user
    const friendUser = users[friendUid];
    if (friendUser && !friendUser.onChatPage && friendUser.fcmToken) {
            const senderName = users[currentUser.uid]?.displayName || 'Anonymous';
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        recipientUid: friendUid,
        senderName: senderName,
        message: newMessage.substring(0, 50) + (newMessage.length > 50 ? '...' : ''),
        chatId: chatId,
        createdAt: serverTimestamp()
      });
    }

    setNewMessage('');
    if (replyingTo) {
      cancelReply();
    }
  };

    const visibleMessages = messages.filter(msg => !deletedForMe.includes(msg.id));

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h3><FaUserFriends /> Users</h3>
        </div>
        <div className="user-list">
          {Object.entries(users)
            .filter(([uid]) => uid !== currentUser?.uid)
            .map(([uid, user]) => (
            <Link to={`/chat/${uid}`} key={uid} className={`user-item ${friendUid === uid ? 'active' : ''}`}>
                            <div className="avatar">{getInitials(user.displayName)}</div>
              <div className="user-info">
                <span className="user-name">{user.displayName}</span>
                <span className={`status-dot ${user.online ? 'online' : 'offline'}`}></span>
                <span className="last-seen">{!user.online && formatLastSeen(user.lastSeen)}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="sidebar-footer">
           <button onClick={handleLogout} className="logout-btn">
             <FaSignOutAlt /> Logout
           </button>
        </div>
      </div>
      <div className="chat-window">
        {friendUid && users[friendUid] ? (
          <>
                        <div className="chat-header">
              <div className="avatar header-avatar">{getInitials(users[friendUid]?.displayName)}</div>
              <div className="chat-header-info">
                <h2>{users[friendUid]?.displayName || 'Chat'}</h2>
                <span className="status-text">{users[friendUid]?.online ? 'Online' : `Last seen ${formatLastSeen(users[friendUid]?.lastSeen)}`}</span>
              </div>
            </div>
            <div className="messages-area">
              {visibleMessages.map((msg) => (
                <Message 
                  key={msg.id} 
                  msg={msg} 
                  currentUser={currentUser} 
                  onReply={handleReply}
                  getMessageById={getMessageById}
                  formatSeenAt={formatSeenAt}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                />
              ))}
              <div ref={scrollRef}></div>
            </div>
            {replyingTo && (
              <div className="reply-preview">
                <div className="reply-preview-content">
                  <p className="reply-preview-sender">Replying to {users[replyingTo.senderId]?.displayName}</p>
                  <p className="reply-preview-text">{replyingTo.text}</p>
                </div>
                <button onClick={cancelReply} className="cancel-reply-btn"><FaTimes /></button>
              </div>
            )}
            <form className="message-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={!currentUser}
              />
              <button type="submit" disabled={!currentUser}><FaPaperPlane /></button>
            </form>
          </>
        ) : (
          <div className="placeholder">
            <FaUserFriends size={50} />
            <h3>Welcome to the Chat!</h3>
            <p>Select a user from the sidebar to start a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
