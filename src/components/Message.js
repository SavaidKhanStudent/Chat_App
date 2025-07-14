import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BsCheck, BsCheck2All, BsThreeDotsVertical } from 'react-icons/bs';
import './Message.css';

const Message = ({ msg, currentUser, friendUid, onReply, getMessageById, formatSeenAt, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(msg.text);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0, left: 'auto' });

  const isSent = msg.senderId === currentUser?.uid;
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const canEdit = isSent && (Date.now() - (msg.timestamp?.toDate().getTime() || 0)) < 900000; // 15 minutes
  const canDeleteForEveryone = isSent;

  const repliedToMessage = msg.replyTo ? getMessageById(msg.replyTo) : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveEdit = () => {
    if (editedText.trim() && editedText.trim() !== msg.text) {
      onEdit(msg.id, editedText.trim());
    }
    setIsEditing(false);
  };

  const handleOpenMenu = (e) => {
    e.preventDefault();
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 180; // From Message.css

    const position = {
      top: triggerRect.bottom + window.scrollY + 2,
      left: isSent
        ? triggerRect.right + window.scrollX - menuWidth // Open left for sent messages
        : triggerRect.left + window.scrollX, // Open right for received messages
    };

    setMenuPosition(position);
    setIsMenuOpen(true);
  };

  const renderMessageStatus = () => {
    if (!isSent) return null;
    if (msg.seen) return <BsCheck2All className="status-icon seen" title={`Seen at ${formatSeenAt(msg.seenAt)}`} />;
    if (msg.deliveredTo?.includes(friendUid)) return <BsCheck2All className="status-icon" title="Delivered" />;
    if (msg.timestamp) return <BsCheck className="status-icon" title="Sent" />;
    return null;
  };

  if (isEditing) {
    return (
      <div className={`message-container ${isSent ? 'sent' : 'received'}`}>
        <div className="message-bubble">
          <div className="edit-form">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSaveEdit())}
              autoFocus
              className="edit-input"
            />
            <div className="edit-actions">
              <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleSaveEdit} className="save-btn">Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message-container ${isSent ? 'sent' : 'received'}`}>
      <div className="message-bubble">
        <button ref={triggerRef} onClick={handleOpenMenu} className="menu-trigger-btn">
          <BsThreeDotsVertical />
        </button>
        {repliedToMessage && (
          <div className="reply-bubble">
            <p className="reply-sender">{repliedToMessage.senderName || 'User'}</p>
            <p className="reply-text">{repliedToMessage.text}</p>
          </div>
        )}
        <p className="message-text">{msg.text}</p>
        <div className="message-meta">
          {msg.edited && <span className="edited-tag">edited</span>}
          <span className="timestamp">{new Date(msg.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {renderMessageStatus()}
        </div>
      </div>

      {isMenuOpen && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="action-menu-portal"
          style={{ top: menuPosition.top, left: menuPosition.left, right: menuPosition.right }}
        >
          <button onClick={() => { onReply(msg); setIsMenuOpen(false); }}>Reply</button>
          {canEdit && <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}>Edit</button>}
          <button onClick={() => { onDelete(msg.id, 'me'); setIsMenuOpen(false); }}>Delete for Me</button>
          {canDeleteForEveryone && <button onClick={() => { onDelete(msg.id, 'everyone'); setIsMenuOpen(false); }}>Delete for Everyone</button>}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Message;
