import React from 'react';
import './Sidebar.css';

const Sidebar = ({ onRefresh, isRefreshing, currentFolder, onFolderChange }) => {
  const handleFolderClick = (folder) => {
    if (folder === currentFolder) {
      // If clicking the same folder, refresh it
      onRefresh();
    } else {
      // Switch to different folder
      onFolderChange(folder);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <button 
          className={`sidebar-item ${currentFolder === 'inbox' ? 'active' : ''}`} 
          onClick={() => handleFolderClick('inbox')} 
          disabled={isRefreshing && currentFolder === 'inbox'}
        >
          <span className="sidebar-icon">{isRefreshing && currentFolder === 'inbox' ? '⟳' : '📥'}</span>
          <span>Inbox</span>
        </button>
        <button 
          className={`sidebar-item ${currentFolder === 'sentitems' ? 'active' : ''}`} 
          onClick={() => handleFolderClick('sentitems')}
          disabled={isRefreshing && currentFolder === 'sentitems'}
        >
          <span className="sidebar-icon">{isRefreshing && currentFolder === 'sentitems' ? '⟳' : '📤'}</span>
          <span>Sent</span>
        </button>
        <button 
          className={`sidebar-item ${currentFolder === 'drafts' ? 'active' : ''}`} 
          onClick={() => handleFolderClick('drafts')}
          disabled={isRefreshing && currentFolder === 'drafts'}
        >
          <span className="sidebar-icon">{isRefreshing && currentFolder === 'drafts' ? '⟳' : '📝'}</span>
          <span>Drafts</span>
        </button>
        <button 
          className={`sidebar-item ${currentFolder === 'deleteditems' ? 'active' : ''}`} 
          onClick={() => handleFolderClick('deleteditems')}
          disabled={isRefreshing && currentFolder === 'deleteditems'}
        >
          <span className="sidebar-icon">{isRefreshing && currentFolder === 'deleteditems' ? '⟳' : '🗑️'}</span>
          <span>Deleted</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

