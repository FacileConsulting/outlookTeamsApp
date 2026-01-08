/**
 * Microsoft Graph API Service
 * Direct calls to Microsoft Graph API from the frontend
 */

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Make an authenticated request to Microsoft Graph API
 */
const graphRequest = async (accessToken, method, endpoint, data = null) => {
  const config = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${GRAPH_API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Graph API error: ${response.status}`);
  }

  // Handle 204 No Content and 202 Accepted responses (no body)
  if (response.status === 204 || response.status === 202) {
    return { success: true };
  }

  // Check if response has content before parsing JSON
  const text = await response.text();
  
  // If response is empty, return success
  if (!text || text.trim() === '') {
    return { success: true };
  }

  // Try to parse as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    // If parsing fails but response was OK, return success
    return { success: true, raw: text };
  }
};

/**
 * Get current user profile
 */
export const getUserProfile = async (accessToken) => {
  return graphRequest(accessToken, 'GET', '/me');
};

/**
 * Get emails from a specific folder
 */
export const getFolderEmails = async (accessToken, folderId, options = {}) => {
  const { top = 50, skip = 0, filter = '' } = options;
  let endpoint = `/me/mailFolders/${folderId}/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc`;
  
  if (filter) {
    endpoint += `&$filter=${encodeURIComponent(filter)}`;
  }

  return graphRequest(accessToken, 'GET', endpoint);
};

/**
 * Get inbox emails
 */
export const getInboxEmails = async (accessToken, options = {}) => {
  return getFolderEmails(accessToken, 'inbox', options);
};

/**
 * Get sent items emails
 */
export const getSentEmails = async (accessToken, options = {}) => {
  return getFolderEmails(accessToken, 'sentitems', options);
};

/**
 * Get drafts emails
 */
export const getDraftsEmails = async (accessToken, options = {}) => {
  return getFolderEmails(accessToken, 'drafts', options);
};

/**
 * Get deleted items emails
 */
export const getDeletedEmails = async (accessToken, options = {}) => {
  return getFolderEmails(accessToken, 'deleteditems', options);
};

/**
 * Get a specific email by ID
 */
export const getEmail = async (accessToken, emailId) => {
  return graphRequest(accessToken, 'GET', `/me/messages/${emailId}`);
};

/**
 * Send an email
 */
export const sendEmail = async (accessToken, emailData) => {
  const { to, subject, body, cc, bcc } = emailData;

  const message = {
    message: {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: body,
      },
      toRecipients: Array.isArray(to)
        ? to.map((email) => ({ emailAddress: { address: email.trim() } }))
        : [{ emailAddress: { address: to.trim() } }],
      ...(cc && {
        ccRecipients: Array.isArray(cc)
          ? cc.map((email) => ({ emailAddress: { address: email.trim() } }))
          : [{ emailAddress: { address: cc.trim() } }],
      }),
      ...(bcc && {
        bccRecipients: Array.isArray(bcc)
          ? bcc.map((email) => ({ emailAddress: { address: email.trim() } }))
          : [{ emailAddress: { address: bcc.trim() } }],
      }),
    },
  };

  return graphRequest(accessToken, 'POST', '/me/sendMail', message);
};

/**
 * Mark email as read/unread
 */
export const updateEmailReadStatus = async (accessToken, emailId, isRead) => {
  return graphRequest(accessToken, 'PATCH', `/me/messages/${emailId}`, { isRead });
};

/**
 * Delete an email (moves to Deleted Items)
 */
export const deleteEmail = async (accessToken, emailId) => {
  return graphRequest(accessToken, 'DELETE', `/me/messages/${emailId}`);
};

/**
 * Move an email to a different folder (used for restore)
 */
export const moveEmail = async (accessToken, emailId, destinationFolderId) => {
  return graphRequest(accessToken, 'POST', `/me/messages/${emailId}/move`, {
    destinationId: destinationFolderId
  });
};

/**
 * Restore an email from Deleted Items to its original folder
 */
export const restoreEmail = async (accessToken, emailId, originalFolderId) => {
  // Move email from Deleted Items back to original folder
  return graphRequest(accessToken, 'POST', `/me/messages/${emailId}/move`, {
    destinationId: originalFolderId
  });
};

/**
 * Search emails across all folders or in a specific folder
 * Uses $search parameter for full-text search (searches subject, body, sender, etc.)
 */
export const searchEmails = async (accessToken, searchQuery, folderId = null, options = {}) => {
  const { top = 50, skip = 0 } = options;
  
  const searchTerm = searchQuery.trim();
  
  // Microsoft Graph API endpoint with $search parameter
  // $search performs full-text search across subject, body, sender, etc.
  let endpoint;
  if (folderId) {
    // Search in specific folder
    endpoint = `/me/mailFolders/${folderId}/messages?$search="${encodeURIComponent(searchTerm)}"&$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc`;
  } else {
    // Search across all mail folders
    endpoint = `/me/messages?$search="${encodeURIComponent(searchTerm)}"&$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc`;
  }
  
  return graphRequest(accessToken, 'GET', endpoint);
};

/**
 * Search emails using $filter (fallback if $search doesn't work)
 * Searches in subject and sender fields (simpler filter that's more compatible)
 */
export const searchEmailsWithFilter = async (accessToken, searchQuery, folderId = null, options = {}) => {
  const { top = 50, skip = 0 } = options;
  
  const searchTerm = searchQuery.trim();
  
  // Use a simpler filter - just search in subject and sender
  // OData filter syntax for Microsoft Graph API
  const filter = `contains(subject, '${searchTerm.replace(/'/g, "''")}') or contains(from/emailAddress/address, '${searchTerm.replace(/'/g, "''")}') or contains(from/emailAddress/name, '${searchTerm.replace(/'/g, "''")}')`;
  
  let endpoint;
  if (folderId) {
    endpoint = `/me/mailFolders/${folderId}/messages?$filter=${encodeURIComponent(filter)}&$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc`;
  } else {
    endpoint = `/me/messages?$filter=${encodeURIComponent(filter)}&$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc`;
  }
  
  return graphRequest(accessToken, 'GET', endpoint);
};

/**
 * Get email folders
 */
export const getEmailFolders = async (accessToken) => {
  return graphRequest(accessToken, 'GET', '/me/mailFolders');
};

