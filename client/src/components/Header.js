import React from 'react';
import './Header.css';

const Header = ({ user, onLogout, onCompose, newEmailCount, onClearNewEmails }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">Outlook Team App</h1>
        {newEmailCount > 0 && (
          <div className="new-email-badge" onClick={onClearNewEmails} title="Click to clear">
            {newEmailCount} new
          </div>
        )}
      </div>
      <div className="header-right">
        <button className="compose-button" onClick={onCompose}>
          <span>+</span> New Message
        </button>
        {user && (
          <div className="user-info">
            <span className="user-name">{user.displayName || user.mail || user.userPrincipalName}</span>
            <button className="logout-button" onClick={onLogout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

