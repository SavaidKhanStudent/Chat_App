import React, { useState, useEffect, useRef } from 'react';
import { FaReply, FaEllipsisV, FaEdit, FaTrash } from 'react-icons/fa';
import { BsCheck, BsCheck2All } from 'react-icons/bs';
import './Message.css';

const Message = ({ msg, currentUser, onReply, getMessageById, formatSeenAt, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(msg.text);
  const menuRef = useRef(null);

  const isSent = msg.senderId === currentUser?.uid;
  const canEdit = isSent && (Date.now() - (msg.timestamp?.toDate().getTime() || 0)) < 60000; // 1 minute
  const canDelete = isSent;

  const repliedToMessage = msg.replyTo ? getMessageById(msg.replyTo) : null;

  const renderMessageStatus = () => {
    if (!isSent) return null;
    if (msg.seen) return <BsCheck2All className="status-icon seen" />;
    if (msg.delivered) return <BsCheck2All className="status-icon" />;
    return <BsCheck className="status-icon" />;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
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

  if (isEditing) {
    return (
      <div className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
        <div className="message-edit-view">
          <input
            type="text"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            autoFocus
            className="edit-input"
          />
          <div className="edit-actions">
            <button onClick={handleSaveEdit} className="edit-save-btn">Save</button>
            <button onClick={() => setIsEditing(false)} className="edit-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
      <div className="message">
        {repliedToMessage && (
          <div className="quoted-reply">
            <p className="quoted-sender">{repliedToMessage.senderName || 'User'}</p>
            <p className="quoted-text">{repliedToMessage.text}</p>
          </div>
        )}
        <div className="message-content">
          <p>{msg.text} {msg.edited && <span className="edited-tag">(edited)</span>}</p>
          <div className="message-footer">
            <span className="timestamp">{new Date(msg.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {renderMessageStatus()}
          </div>
        </div>
        <div className="message-actions">
          <button className="reply-btn" onClick={() => onReply(msg)}><FaReply /></button>
          <div className="message-actions-trigger">
            <button className="more-actions-btn" onClick={() => setShowMenu(prev => !prev)}><FaEllipsisV /></button>
            {showMenu && (
              <div className="message-actions-menu" ref={menuRef}>
                {canEdit && <button onClick={() => { setIsEditing(true); setShowMenu(false); }}><FaEdit /> Edit</button>}
                {canDelete && <button onClick={() => { onDelete(msg.id, 'everyone'); setShowMenu(false); }}><FaTrash /> Delete for Everyone</button>}
                <button onClick={() => { onDelete(msg.id, 'me'); setShowMenu(false); }}><FaTrash /> Delete for Me</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isSent && msg.seen && (
        <div className="seen-status">{formatSeenAt(msg.seenAt)}</div>
      )}
    </div>
  );
};

export default Message;
