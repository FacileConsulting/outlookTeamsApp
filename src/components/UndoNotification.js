import React, { useState, useEffect } from 'react';
import './UndoNotification.css';

const UndoNotification = ({ emailSubject, onUndo, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onDismiss) {
            onDismiss();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [onDismiss]);

  const getPreview = (subject) => {
    return subject.length > 50 ? subject.substring(0, 50) + '...' : subject;
  };

  if (!emailSubject) {
    return null;
  }

  return (
    <div className="undo-notification" role="alert">
      <div className="undo-notification-content">
        <span className="undo-message">
          Email deleted: {getPreview(emailSubject)}
        </span>
        <div className="undo-actions">
          <button className="undo-button" onClick={onUndo} type="button">
            Undo
          </button>
          <button className="undo-dismiss-button" onClick={onDismiss} type="button" aria-label="Dismiss">
            ✕
          </button>
        </div>
      </div>
      <div className="undo-timer-bar" style={{ width: `${(timeLeft / 5) * 100}%` }}></div>
    </div>
  );
};

export default UndoNotification;

