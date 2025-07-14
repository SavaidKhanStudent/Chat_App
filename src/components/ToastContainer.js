import React, { useEffect } from 'react';
import { useNotifier } from '../context/ErrorContext';
import './ToastContainer.css';

const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`toast toast--${type}`}>
      <p className="toast__message">{message}</p>
      <button className="toast__close-btn" onClick={onDismiss}>&times;</button>
    </div>
  );
};

const ToastContainer = () => {
  const { notifications, removeNotification } = useNotifier();

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="toast-container">
      {notifications.map(({ id, message, type }) => (
        <Toast 
          key={id} 
          message={message} 
          type={type} 
          onDismiss={() => removeNotification(id)} 
        />
      ))}
    </div>
  );
};

export default ToastContainer;
