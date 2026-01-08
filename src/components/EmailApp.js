import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import * as graphApi from '../services/graphApi';
import EmailList from './EmailList';
import EmailViewer from './EmailViewer';
import ComposeEmail from './ComposeEmail';
import Sidebar from './Sidebar';
import Header from './Header';
import UndoNotification from './UndoNotification';
import './EmailApp.css';

const EmailApp = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newEmailCount, setNewEmailCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  const [currentSkip, setCurrentSkip] = useState(0);
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchAllFolders, setSearchAllFolders] = useState(false);
  const [undoInfo, setUndoInfo] = useState(null);
  const undoTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    initializeApp();
  }, []);

  // Search emails function
  const performSearch = useCallback(async (query, folder = null, searchAll = false) => {
    if (!accessToken || !query || query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      // If searchAll is true, search across all folders (folderId = null)
      const folderToSearch = searchAll ? null : (folder || currentFolder);
      const response = await graphApi.searchEmails(accessToken, query.trim(), folderToSearch, { top: 50 });
      setSearchResults(response.value || []);
    } catch (error) {
      console.error('Error searching emails:', error);
      
      // If $search fails (might not be supported), try client-side filtering
      // This is a fallback that searches through already loaded emails
      if (error.message && error.message.includes('400')) {
        // $search might not be available, try client-side search as fallback
        console.log('Using client-side search fallback');
        try {
          // Fetch emails and filter client-side
          let allEmails = [];
          const folderToSearch = searchAll ? null : (folder || currentFolder);
          
          if (folderToSearch) {
            const response = await graphApi.getFolderEmails(accessToken, folderToSearch, { top: 100 });
            allEmails = response.value || [];
          } else {
            // Search across all folders - get from inbox, sent, drafts
            const [inboxRes, sentRes, draftsRes] = await Promise.all([
              graphApi.getInboxEmails(accessToken, { top: 100 }).catch(() => ({ value: [] })),
              graphApi.getSentEmails(accessToken, { top: 100 }).catch(() => ({ value: [] })),
              graphApi.getDraftsEmails(accessToken, { top: 100 }).catch(() => ({ value: [] }))
            ]);
            allEmails = [
              ...(inboxRes.value || []),
              ...(sentRes.value || []),
              ...(draftsRes.value || [])
            ];
          }
          
          // Client-side filtering
          const searchLower = query.trim().toLowerCase();
          const filtered = allEmails.filter(email => {
            const subject = (email.subject || '').toLowerCase();
            const body = (email.bodyPreview || email.body?.content || '').toLowerCase();
            const fromName = (email.from?.emailAddress?.name || '').toLowerCase();
            const fromEmail = (email.from?.emailAddress?.address || '').toLowerCase();
            
            return subject.includes(searchLower) ||
                   body.includes(searchLower) ||
                   fromName.includes(searchLower) ||
                   fromEmail.includes(searchLower);
          });
          
          setSearchResults(filtered);
        } catch (fallbackError) {
          console.error('Client-side search also failed:', fallbackError);
          setSearchResults([]);
          alert('Search is not available. Please try refreshing the page or check your permissions.');
        }
      } else {
        setSearchResults([]);
        alert(`Search failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsSearching(false);
    }
  }, [accessToken, currentFolder]);

  // Handle search input with debouncing
  const handleSearchChange = useCallback((query, searchAll = false) => {
    setSearchQuery(query);
    setSearchAllFolders(searchAll);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If query is empty, clear search results
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    // Debounce search - wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query, null, searchAll);
    }, 500);
  }, [performSearch]);

  // Clear search function - defined before useEffect that uses it
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchAllFolders(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Keyboard shortcut for search (Ctrl+F or /)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F or Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        // Focus will be handled by EmailList component
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
      // / key to focus search (when not typing in input)
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        handleClearSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery, handleClearSearch]);

  // Check for new emails function (only checks first 50 for new emails, only for inbox)
  const checkForNewEmails = useCallback(async () => {
    if (!accessToken || isRefreshingRef.current || currentFolder !== 'inbox' || searchQuery.trim() !== '') return;
    
    try {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      const response = await graphApi.getInboxEmails(accessToken, { top: 50, skip: 0 });
      const newEmails = response.value || [];
      
      // Detect new emails and removed emails by comparing with existing emails
      setEmails(prevEmails => {
        if (prevEmails.length === 0) {
          // If no previous emails, just return new emails
          return newEmails;
        }
        
        // Create sets for comparison
        const currentEmailIds = new Set(prevEmails.map(e => e.id));
        const newEmailIds = new Set(newEmails.map(e => e.id));
        
        // Find new emails (in API but not in current list)
        const newEmailsList = newEmails.filter(e => !currentEmailIds.has(e.id));
        
        // Find removed emails (in current list but not in API - these were deleted)
        // Filter out deleted emails from the current list
        const filteredEmails = prevEmails.filter(e => newEmailIds.has(e.id));
        
        // If there are new emails, show notification
        if (newEmailsList.length > 0) {
          setNewEmailCount(prev => prev + newEmailsList.length);
          // Show notification if browser supports it
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`New email${newEmailsList.length > 1 ? 's' : ''} received`, {
              body: newEmailsList.length === 1 
                ? `From: ${newEmailsList[0].from?.emailAddress?.name || newEmailsList[0].from?.emailAddress?.address}`
                : `${newEmailsList.length} new emails`,
              icon: '/favicon.ico',
            });
          }
        }
        
        // Merge: keep existing emails that are still in API (updated), add new ones
        const emailMap = new Map();
        
        // First, add all existing emails that are still in the API
        filteredEmails.forEach(email => {
          emailMap.set(email.id, email);
        });
        
        // Then update with the latest version from API (for read status changes, etc.)
        newEmails.forEach(newEmail => {
          emailMap.set(newEmail.id, newEmail);
        });
        
        // Convert map back to array and sort by receivedDateTime descending
        const mergedEmails = Array.from(emailMap.values()).sort((a, b) => {
          const dateA = new Date(a.receivedDateTime || a.sentDateTime || 0);
          const dateB = new Date(b.receivedDateTime || b.sentDateTime || 0);
          return dateB - dateA;
        });
        
        return mergedEmails;
      });
      
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error checking for new emails:', error);
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [accessToken, currentFolder]);

  // Auto-refresh emails every 30 seconds
  useEffect(() => {
    if (!accessToken) return;

    const refreshInterval = setInterval(() => {
      checkForNewEmails();
    }, 30000); // 30 seconds

    // Also check when window regains focus
    const handleFocus = () => {
      checkForNewEmails();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [accessToken, checkForNewEmails]);

  const initializeApp = async () => {
    try {
      // Get access token
      const token = await getAccessToken();
      if (token) {
        setAccessToken(token);
        await fetchUserProfile(token);
        await fetchEmails(token, false, false, 'inbox');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = async () => {
    try {
      if (accounts.length > 0) {
        const response = await instance.acquireTokenSilent({
          scopes: [
            'https://graph.microsoft.com/Mail.ReadWrite',
            'https://graph.microsoft.com/Mail.Send',
            'https://graph.microsoft.com/User.Read',
          ],
          account: accounts[0],
        });
        return response.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      // Try interactive login if silent fails
      try {
        const response = await instance.acquireTokenPopup({
          scopes: [
            'https://graph.microsoft.com/Mail.ReadWrite',
            'https://graph.microsoft.com/Mail.Send',
            'https://graph.microsoft.com/User.Read',
          ],
        });
        return response.accessToken;
      } catch (popupError) {
        console.error('Error acquiring token via popup:', popupError);
        return null;
      }
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      const userData = await graphApi.getUserProfile(token);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchEmails = useCallback(async (token, showLoading = false, append = false, folder = null) => {
    try {
      if (showLoading) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
      }
      
      const folderToUse = folder || currentFolder;
      const skip = append ? currentSkip : 0;
      
      // Get emails from the appropriate folder
      let response;
      switch (folderToUse) {
        case 'sentitems':
          response = await graphApi.getSentEmails(token, { top: 50, skip });
          break;
        case 'drafts':
          response = await graphApi.getDraftsEmails(token, { top: 50, skip });
          break;
        case 'deleteditems':
          response = await graphApi.getDeletedEmails(token, { top: 50, skip });
          break;
        case 'inbox':
        default:
          response = await graphApi.getInboxEmails(token, { top: 50, skip });
          break;
      }
      
      const newEmails = response.value || [];
      
      // Check if there are more emails to load
      setHasMoreEmails(newEmails.length === 50);
      
      if (append) {
        // Append new emails to existing list
        setEmails(prevEmails => {
          const existingIds = new Set(prevEmails.map(e => e.id));
          const uniqueNewEmails = newEmails.filter(e => !existingIds.has(e.id));
          return [...prevEmails, ...uniqueNewEmails];
        });
        setCurrentSkip(prev => prev + newEmails.length);
      } else {
        // Replace emails (initial load or refresh)
        setEmails(prevEmails => {
          if (prevEmails.length > 0 && newEmails.length > 0) {
            const existingIds = new Set(prevEmails.map(e => e.id));
            const newEmailsList = newEmails.filter(e => !existingIds.has(e.id));
            
            if (newEmailsList.length > 0) {
              setNewEmailCount(prev => prev + newEmailsList.length);
              // Show notification if browser supports it
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`New email${newEmailsList.length > 1 ? 's' : ''} received`, {
                  body: newEmailsList.length === 1 
                    ? `From: ${newEmailsList[0].from?.emailAddress?.name || newEmailsList[0].from?.emailAddress?.address}`
                    : `${newEmailsList.length} new emails`,
                  icon: '/favicon.ico',
                });
              }
            }
          }
          return newEmails;
        });
        setCurrentSkip(newEmails.length);
      }
      
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      if (showLoading) {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      }
    }
  }, [currentSkip, currentFolder]);


  const handleLogout = () => {
    instance.logoutPopup();
    navigate('/login');
  };

  const handleEmailSelect = async (email) => {
    setSelectedEmail(email);
    // Mark as read if unread
    if (!email.isRead && accessToken) {
      try {
        await graphApi.updateEmailReadStatus(accessToken, email.id, true);
        // Update local state
        setEmails(emails.map(e => e.id === email.id ? { ...e, isRead: true } : e));
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const handleSendEmail = async (emailData) => {
    try {
      await graphApi.sendEmail(accessToken, emailData);
      setIsComposing(false);
      // Refresh current folder (if in sent folder, will show the sent email)
      await fetchEmails(accessToken, false, false, currentFolder);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const handleDeleteEmail = async (emailId) => {
    if (!accessToken) {
      alert('Not authenticated. Please log in again.');
      return;
    }

    // Find the email to delete
    const emailToDelete = emails.find(e => e.id === emailId);
    if (!emailToDelete) return;

    // Optimistically remove the email from UI immediately
    setEmails(prevEmails => {
      const filtered = prevEmails.filter(e => e.id !== emailId);
      return filtered;
    });
    
    // Clear selected email if it was the deleted one
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
    
    // Update skip count
    setCurrentSkip(prev => Math.max(0, prev - 1));

    try {
      await graphApi.deleteEmail(accessToken, emailId);
      
      // Show undo notification
      setUndoInfo({
        emailId: emailId,
        email: emailToDelete,
        folder: currentFolder,
        timestamp: Date.now()
      });

      // Auto-clear undo option after 5 seconds
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      undoTimeoutRef.current = setTimeout(() => {
        setUndoInfo(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error deleting email:', error);
      
      // If deletion failed, restore the email to the list
      setEmails(prevEmails => {
        const exists = prevEmails.some(e => e.id === emailId);
        if (!exists) {
          return [emailToDelete, ...prevEmails];
        }
        return prevEmails;
      });
      
      // Check if it's a 403 Forbidden error (permission issue)
      if (error.message && (error.message.includes('403') || error.message.includes('Forbidden'))) {
        alert(
          'Permission denied. Please ensure:\n\n' +
          '1. Your Azure AD app has "Mail.ReadWrite" permission (not just "Mail.Read")\n' +
          '2. Admin consent has been granted\n' +
          '3. You have logged out and logged back in to refresh your token\n\n' +
          'See README.md for setup instructions.'
        );
      } else {
        alert(`Failed to delete email: ${error.message || 'Unknown error'}. The email has been restored.`);
      }
    }
  };

  const handleUndoDelete = async () => {
    if (!undoInfo || !accessToken) return;

    try {
      // Map folder name to folder ID for Microsoft Graph API
      const folderIdMap = {
        'inbox': 'inbox',
        'sentitems': 'sentitems',
        'drafts': 'drafts',
        'deleteditems': 'deleteditems'
      };
      const destinationFolderId = folderIdMap[undoInfo.folder] || 'inbox';
      
      // Restore email by moving it back from Deleted Items to original folder
      await graphApi.restoreEmail(accessToken, undoInfo.emailId, destinationFolderId);
      
      // If we're currently viewing the folder where the email was restored, add it back
      if (currentFolder === undoInfo.folder) {
        setEmails(prevEmails => {
          const exists = prevEmails.some(e => e.id === undoInfo.emailId);
          if (!exists) {
            // Insert at the beginning to maintain order
            return [undoInfo.email, ...prevEmails];
          }
          return prevEmails;
        });
      } else {
        // Refresh the folder if we're not viewing it
        await fetchEmails(accessToken, false, false, undoInfo.folder);
      }

      // Clear undo info
      setUndoInfo(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error restoring email:', error);
      alert('Failed to restore email. It may have been permanently deleted.');
      setUndoInfo(null);
    }
  };

  const handleRefresh = async () => {
    if (accessToken) {
      setNewEmailCount(0); // Reset new email count on manual refresh
      setCurrentSkip(0); // Reset pagination
      setHasMoreEmails(true); // Reset has more flag
      setSelectedEmail(null); // Clear selected email
      await fetchEmails(accessToken, true, false, currentFolder);
    }
  };

  const handleFolderChange = async (folder) => {
    if (accessToken && folder !== currentFolder) {
      setCurrentFolder(folder);
      setCurrentSkip(0); // Reset pagination
      setHasMoreEmails(true); // Reset has more flag
      setSelectedEmail(null); // Clear selected email
      setNewEmailCount(0); // Reset new email count
      handleClearSearch(); // Clear search when changing folders
      await fetchEmails(accessToken, true, false, folder);
    }
  };

  const loadMoreEmails = useCallback(async () => {
    if (!accessToken || isLoadingMore || !hasMoreEmails) return;
    
    try {
      setIsLoadingMore(true);
      // Get current skip value
      const skipValue = currentSkip;
      
      // Get emails from the appropriate folder
      let response;
      switch (currentFolder) {
        case 'sentitems':
          response = await graphApi.getSentEmails(accessToken, { top: 50, skip: skipValue });
          break;
        case 'drafts':
          response = await graphApi.getDraftsEmails(accessToken, { top: 50, skip: skipValue });
          break;
        case 'deleteditems':
          response = await graphApi.getDeletedEmails(accessToken, { top: 50, skip: skipValue });
          break;
        case 'inbox':
        default:
          response = await graphApi.getInboxEmails(accessToken, { top: 50, skip: skipValue });
          break;
      }
      const newEmails = response.value || [];
      
      // Check if there are more emails to load
      setHasMoreEmails(newEmails.length === 50);
      
      // Append new emails to existing list
      setEmails(prevEmails => {
        const existingIds = new Set(prevEmails.map(e => e.id));
        const uniqueNewEmails = newEmails.filter(e => !existingIds.has(e.id));
        return [...prevEmails, ...uniqueNewEmails];
      });
      
      setCurrentSkip(prev => prev + newEmails.length);
    } catch (error) {
      console.error('Error loading more emails:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [accessToken, isLoadingMore, hasMoreEmails, currentSkip, currentFolder]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="email-app">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onCompose={() => setIsComposing(true)}
        newEmailCount={newEmailCount}
        onClearNewEmails={() => setNewEmailCount(0)}
      />
      {undoInfo && undoInfo.email && (
        <UndoNotification
          emailSubject={undoInfo.email.subject || '(No Subject)'}
          onUndo={handleUndoDelete}
          onDismiss={() => {
            setUndoInfo(null);
            if (undoTimeoutRef.current) {
              clearTimeout(undoTimeoutRef.current);
            }
          }}
        />
      )}
      <div className="email-app-body">
        <Sidebar 
          onRefresh={handleRefresh} 
          isRefreshing={isRefreshing}
          currentFolder={currentFolder}
          onFolderChange={handleFolderChange}
        />
        <EmailList
          emails={searchQuery.trim() ? searchResults : emails}
          selectedEmail={selectedEmail}
          onEmailSelect={handleEmailSelect}
          onDelete={handleDeleteEmail}
          isRefreshing={isRefreshing}
          lastRefreshTime={lastRefreshTime}
          onLoadMore={loadMoreEmails}
          isLoadingMore={isLoadingMore}
          hasMoreEmails={hasMoreEmails}
          currentFolder={currentFolder}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          isSearching={isSearching}
          searchAllFolders={searchAllFolders}
          onSearchAllFoldersChange={setSearchAllFolders}
        />
        {isComposing ? (
          <ComposeEmail
            onSend={handleSendEmail}
            onCancel={() => setIsComposing(false)}
          />
        ) : (
          <EmailViewer email={selectedEmail} />
        )}
      </div>
    </div>
  );
};

export default EmailApp;

