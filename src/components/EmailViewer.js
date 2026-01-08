import React from 'react';
import './EmailViewer.css';

const EmailViewer = ({ email }) => {
  if (!email) {
    return (
      <div className="email-viewer empty">
        <div className="empty-state">
          <p>Select an email to view</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatRecipients = (recipients) => {
    if (!recipients || recipients.length === 0) return 'None';
    return recipients.map(r => r.emailAddress?.name || r.emailAddress?.address).join(', ');
  };

  return (
    <div className="email-viewer">
      <div className="email-viewer-header">
        <div className="email-viewer-subject">{email.subject || '(No Subject)'}</div>
        <div className="email-viewer-meta">
          <div className="email-meta-row">
            <span className="meta-label">From:</span>
            <span className="meta-value">
              {email.from?.emailAddress?.name || email.from?.emailAddress?.address}
              {email.from?.emailAddress?.address && (
                <span className="meta-email">&lt;{email.from.emailAddress.address}&gt;</span>
              )}
            </span>
          </div>
          {email.toRecipients && email.toRecipients.length > 0 && (
            <div className="email-meta-row">
              <span className="meta-label">To:</span>
              <span className="meta-value">{formatRecipients(email.toRecipients)}</span>
            </div>
          )}
          {email.ccRecipients && email.ccRecipients.length > 0 && (
            <div className="email-meta-row">
              <span className="meta-label">Cc:</span>
              <span className="meta-value">{formatRecipients(email.ccRecipients)}</span>
            </div>
          )}
          <div className="email-meta-row">
            <span className="meta-label">Date:</span>
            <span className="meta-value">{formatDate(email.receivedDateTime)}</span>
          </div>
        </div>
      </div>
      <div className="email-viewer-body">
        {email.body?.contentType === 'html' ? (
          <div
            className="email-body-html"
            dangerouslySetInnerHTML={{ __html: email.body.content }}
          />
        ) : (
          <div className="email-body-text">
            {email.body?.content || email.bodyPreview || 'No content'}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailViewer;

