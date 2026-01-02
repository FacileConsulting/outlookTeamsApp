# Quick Setup Guide

## Step 1: Azure AD App Registration (SPA)

1. Visit https://portal.azure.com
2. Go to **Azure Active Directory** > **App registrations** > **New registration**
3. Configure:
   - Name: `Outlook Team App`
   - **Platform**: Select **Single-page application (SPA)**
   - Redirect URI: `http://localhost:3000`
4. After registration, copy:
   - **Application (client) ID**
   - **Directory (tenant) ID**
5. Go to **API permissions** > Add:
   - `Mail.ReadWrite` (Delegated) - For reading and deleting emails
   - `Mail.Send` (Delegated) - For sending emails
   - `User.Read` (Delegated) - For user profile
6. Click **Grant admin consent**
   
   **Important**: `Mail.ReadWrite` is required for delete functionality. If you previously only had `Mail.Read`, you'll need to add `Mail.ReadWrite` and re-authenticate.

**No client secret needed!** SPAs use PKCE flow.

## Step 2: Install Dependencies

```bash
cd client
npm install
```

## Step 3: Configure Environment

Create `client/.env` file:
```env
REACT_APP_CLIENT_ID=your_application_client_id
REACT_APP_TENANT_ID=your_directory_tenant_id
```

Use `common` as tenant ID to support all Microsoft accounts.

## Step 4: Run the Application

**HTTP:**
```bash
npm start
```

**HTTPS (recommended):**
```bash
npm run start:https
```

Or add `HTTPS=true` to `client/.env` file.

Visit http://localhost:3000 (or https://localhost:3000 for HTTPS) and sign in with your Microsoft account!

> **Note**: If using HTTPS, update Azure AD redirect URI to `https://localhost:3000`. See [HTTPS_SETUP.md](./HTTPS_SETUP.md) for detailed HTTPS configuration.

## That's It!

No backend server needed - everything runs in the browser and talks directly to Microsoft Graph API! 🚀
