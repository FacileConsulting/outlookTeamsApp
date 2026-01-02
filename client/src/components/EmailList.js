import React, { useEffect, useRef, useCallback } from 'react';
import './EmailList.css';

const EmailList = ({ 
  emails, 
  selectedEmail, 
  onEmailSelect, 
  onDelete, 
  isRefreshing, 
  lastRefreshTime,
  onLoadMore,
  isLoadingMore,
  hasMoreEmails,
  currentFolder,
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching,
  searchAllFolders,
  onSearchAllFoldersChange
}) => {
  const scrollContainerRef = useRef(null);
  const observerRef = useRef(null);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPreview = (body) => {
    if (!body) return '';
    const text = body.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  const formatLastRefresh = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  // Intersection Observer for infinite scroll
  const lastEmailElementRef = useCallback((node) => {
    if (isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreEmails && !isLoadingMore) {
        onLoadMore();
      }
    }, {
      root: scrollContainerRef.current,
      rootMargin: '100px',
      threshold: 0.1
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, hasMoreEmails, onLoadMore]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const getFolderName = (folder) => {
    const folderNames = {
      'inbox': 'Inbox',
      'sentitems': 'Sent Items',
      'drafts': 'Drafts',
      'deleteditems': 'Deleted Items'
    };
    return folderNames[folder] || 'Inbox';
  };

  return (
    <div className="email-list">
      <div className="email-list-header">
        <div className="email-list-header-top">
          <h2>{searchQuery ? `Search: "${searchQuery}"` : getFolderName(currentFolder)}</h2>
          {(isRefreshing || isSearching) && <span className="refreshing-indicator">⟳</span>}
        </div>
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search emails... (Press / to focus)"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value, searchAllFolders)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Trigger immediate search on Enter
                  if (onSearchChange && searchQuery) {
                    onSearchChange(searchQuery, searchAllFolders);
                  }
                }
              }}
            />
            {searchQuery && (
              <button
                className="search-clear-button"
                onClick={onClearSearch}
                title="Clear search (Esc)"
              >
                ✕
              </button>
            )}
          </div>
          <div className="search-options">
            <label className="search-option-checkbox">
              <input
                type="checkbox"
                checked={searchAllFolders || false}
                onChange={(e) => {
                  if (onSearchAllFoldersChange) {
                    onSearchAllFoldersChange(e.target.checked);
                    // Re-search with new option
                    if (searchQuery && onSearchChange) {
                      onSearchChange(searchQuery, e.target.checked);
                    }
                  }
                }}
              />
              <span>Search all folders</span>
            </label>
          </div>
        </div>
        <div className="email-list-header-bottom">
          <span className="email-count">
            {searchQuery ? `${emails.length} search results` : `${emails.length} messages`}
          </span>
          {!searchQuery && lastRefreshTime && (
            <span className="last-refresh">Last refresh: {formatLastRefresh(lastRefreshTime)}</span>
          )}
        </div>
      </div>
      <div className="email-list-content" ref={scrollContainerRef}>
        {isSearching ? (
          <div className="empty-state">
            <div className="loading-spinner-small"></div>
            <p>Searching...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="empty-state">
            <p>{searchQuery ? `No emails found for "${searchQuery}"` : 'No emails found'}</p>
          </div>
        ) : (
          emails.map((email, index) => {
            const isLastEmail = index === emails.length - 1;
            return (
              <div
                key={email.id}
                ref={isLastEmail ? lastEmailElementRef : null}
                className={`email-item ${selectedEmail?.id === email.id ? 'selected' : ''} ${!email.isRead ? 'unread' : ''}`}
                onClick={() => onEmailSelect(email)}
              >
              <div className="email-item-header">
                <div className="email-sender">
                  {!email.isRead && <span className="unread-indicator"></span>}
                  <strong>{email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Unknown'}</strong>
                </div>
                <div className="email-actions">
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (onDelete) {
                        onDelete(email.id);
                      }
                    }}
                    title="Delete"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="email-subject">{email.subject || '(No Subject)'}</div>
              <div className="email-preview">{getPreview(email.bodyPreview || email.body?.content)}</div>
              <div className="email-date">{formatDate(email.receivedDateTime)}</div>
            </div>
            );
          })
        )}
        {isLoadingMore && (
          <div className="loading-more">
            <div className="loading-spinner-small"></div>
            <span>Loading more emails...</span>
          </div>
        )}
        {!searchQuery && !hasMoreEmails && emails.length > 0 && (
          <div className="no-more-emails">
            <p>No more emails to load</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailList;

