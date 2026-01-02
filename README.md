# Outlook Team App

A modern email application similar to Outlook with Microsoft Teams authentication. **Frontend-only SPA that talks directly to Microsoft Graph API** - no backend server required!

## Features

- 📧 **Send and Receive Emails** - Full email functionality using Microsoft Graph API
- 🔐 **Microsoft Teams Authentication** - Secure authentication using MSAL (Microsoft Authentication Library) in the browser
- 🎨 **Modern UI** - Outlook-like interface with a clean, responsive design
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🚀 **No Backend Required** - Direct communication with Microsoft Graph API from the browser
- ⚡ **Fast & Lightweight** - Pure frontend application

## Why No Backend?

This application uses **MSAL.js** (public client) in the browser, which:
- Uses **PKCE flow** for secure authentication (no client secret needed)
- Calls **Microsoft Graph API directly** from the frontend
- Eliminates the need for a backend server
- Perfect for Teams apps and SPAs

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Microsoft Azure AD App Registration with the following permissions:
  - `Mail.ReadWrite` (Delegated) - Required for reading and deleting emails
  - `Mail.Send` (Delegated) - Required for sending emails
  - `User.Read` (Delegated) - Required for user profile

## Setup Instructions

### 1. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: Outlook Team App
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: 
     - Type: **Single-page application (SPA)**
     - URI: `http://localhost:3000`
5. Click **Register**
6. Note down:
   - **Application (client) ID**
   - **Directory (tenant) ID**
7. Go to **API permissions** > **Add a permission** > **Microsoft Graph** > **Delegated permissions**
   - Add: `Mail.ReadWrite`, `Mail.Send`, `User.Read`
   - Click **Add permissions**
   - Click **Grant admin consent** (if you have admin rights)
   
   **Note**: `Mail.ReadWrite` includes both read and write permissions (including delete). It replaces `Mail.Read`.

**Important**: For SPA apps, you don't need a client secret! The app uses PKCE flow.

### 2. Install Dependencies

```bash
npm run install-all
```

Or manually:
```bash
cd client
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `client` directory:

```env
REACT_APP_CLIENT_ID=your_client_id_here
REACT_APP_TENANT_ID=your_tenant_id_here
```

**Note**: You can use `common` as the tenant ID to support both personal and work/school accounts.

### 4. Run the Application

**HTTP (default):**
```bash
npm start
```

Or:
```bash
cd client
npm start
```

The application will be available at: **http://localhost:3000**

**HTTPS (recommended for production-like testing):**
```bash
npm run start:https
```

Or add `HTTPS=true` to `client/.env` file, then run:
```bash
npm start
```

The application will be available at: **https://localhost:3000**

> **Note**: For detailed HTTPS setup instructions, including trusted local certificates, see [HTTPS_SETUP.md](./HTTPS_SETUP.md)

## Project Structure

```
OutlookTeam/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── EmailApp.js
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js
│   │   │   ├── EmailList.js
│   │   │   ├── EmailViewer.js
│   │   │   └── ComposeEmail.js
│   │   ├── services/
│   │   │   └── graphApi.js      # Direct Graph API calls
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```

## How It Works

1. **Authentication**: Uses MSAL.js in the browser with PKCE flow
2. **Token Management**: MSAL handles token acquisition and refresh automatically
3. **API Calls**: Direct calls to Microsoft Graph API from the browser using fetch API
4. **No Backend**: Everything runs in the browser - perfect for Teams apps!

## Technologies Used

- **Frontend**: React, React Router
- **Authentication**: Microsoft Authentication Library (MSAL) for Browser
- **Email API**: Microsoft Graph API (direct calls)
- **Styling**: CSS3 with modern design patterns

## Troubleshooting

### Authentication Issues
- Ensure your Azure AD app is registered as a **Single-page application (SPA)**
- Verify that the redirect URI matches exactly: `http://localhost:3000`
- Check that all required permissions are granted and admin consent is provided
- Verify CLIENT_ID and TENANT_ID are correctly set in `client/.env`

### CORS Issues
- Microsoft Graph API supports CORS for browser-based applications
- If you see CORS errors, check that your app is registered as SPA type in Azure AD

### Email Issues
- Verify that the user has granted consent for Mail.Read and Mail.Send permissions
- Check browser console for detailed error messages
- Ensure the access token includes the required scopes

## Building for Production

```bash
npm run build
```

This creates an optimized production build in `client/build/` that can be deployed to any static hosting service (Azure Static Web Apps, Netlify, Vercel, etc.).

## License

MIT

## Support

For issues and questions, please check the Microsoft Graph API documentation:
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/overview)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser)
- [Microsoft Graph API Reference](https://docs.microsoft.com/en-us/graph/api/overview)
