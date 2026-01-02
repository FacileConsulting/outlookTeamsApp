import React, { useState } from 'react';
import './ComposeEmail.css';

const ComposeEmail = ({ onSend, onCancel }) => {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const handleSend = () => {
    if (!to || !subject || !body) {
      alert('Please fill in all required fields (To, Subject, Body)');
      return;
    }

    const emailData = {
      to: to.split(',').map(email => email.trim()).filter(email => email),
      subject,
      body,
      ...(cc && { cc: cc.split(',').map(email => email.trim()).filter(email => email) }),
      ...(bcc && { bcc: bcc.split(',').map(email => email.trim()).filter(email => email) }),
    };

    onSend(emailData);
    
    // Reset form
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
  };

  return (
    <div className="compose-email">
      <div className="compose-header">
        <h2>New Message</h2>
        <div className="compose-actions">
          <button className="compose-button-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="compose-button-primary" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
      <div className="compose-body">
        <div className="compose-field">
          <label>To</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Recipients (comma-separated)"
            required
          />
        </div>
        {showCc && (
          <div className="compose-field">
            <label>Cc</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Cc recipients (comma-separated)"
            />
          </div>
        )}
        {showBcc && (
          <div className="compose-field">
            <label>Bcc</label>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="Bcc recipients (comma-separated)"
            />
          </div>
        )}
        <div className="compose-field">
          <div className="compose-field-header">
            <label>Subject</label>
            <div className="compose-field-options">
              {!showCc && (
                <button
                  className="compose-option-button"
                  onClick={() => setShowCc(true)}
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  className="compose-option-button"
                  onClick={() => setShowBcc(true)}
                >
                  Bcc
                </button>
              )}
            </div>
          </div>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            required
          />
        </div>
        <div className="compose-field">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message body"
            rows={15}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default ComposeEmail;

