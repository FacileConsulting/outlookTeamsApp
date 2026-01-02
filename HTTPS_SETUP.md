# Running the App on HTTPS

This guide explains how to run the Outlook Team App on HTTPS for local development and production.

## Why HTTPS?

- **Required for Production**: Most hosting services require HTTPS
- **Better Security**: Encrypts data in transit
- **OAuth Best Practices**: Some OAuth providers prefer HTTPS
- **Modern Browser Features**: Some APIs require HTTPS (Service Workers, etc.)

## Option 1: Quick HTTPS with Create React App (Development)

Create React App supports HTTPS out of the box with a simple environment variable.

### Steps:

1. **Update your `.env` file** in the `client` directory:
   ```env
   REACT_APP_CLIENT_ID=your_client_id_here
   REACT_APP_TENANT_ID=your_tenant_id_here
   HTTPS=true
   ```

2. **Run the app**:
   ```bash
   cd client
   npm start
   ```

   Or use the HTTPS script:
   ```bash
   npm run start:https
   ```

3. **Accept the self-signed certificate**:
   - Your browser will show a security warning (this is normal for local development)
   - Click "Advanced" → "Proceed to localhost (unsafe)" or similar
   - The app will run on `https://localhost:3000`

4. **Update Azure AD Redirect URI**:
   - Go to Azure Portal → Your App Registration
   - Update the redirect URI to: `https://localhost:3000`
   - Make sure it's set as **Single-page application (SPA)**

## Option 2: Using mkcert for Trusted Local Certificates (Recommended for Development)

This creates locally-trusted SSL certificates so you won't see browser warnings.

### Installation:

**Windows:**
```powershell
# Using Chocolatey
choco install mkcert

# Or using Scoop
scoop bucket add extras
scoop install mkcert
```

**macOS:**
```bash
brew install mkcert
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
# Then install mkcert from releases: https://github.com/FiloSottile/mkcert/releases
```

### Setup:

1. **Install the local CA**:
   ```bash
   mkcert -install
   ```

2. **Create certificates for localhost**:
   ```bash
   cd client
   mkdir -p .cert
   mkcert -key-file .cert/key.pem -cert-file .cert/cert.pem localhost 127.0.0.1 ::1
   ```

3. **Update package.json** to use the certificates:
   ```json
   "scripts": {
     "start:https": "HTTPS=true SSL_CRT_FILE=.cert/cert.pem SSL_KEY_FILE=.cert/key.pem react-scripts start"
   }
   ```

4. **Add `.cert/` to `.gitignore`**:
   ```
   .cert/
   *.pem
   ```

5. **Run with HTTPS**:
   ```bash
   npm run start:https
   ```

Now you'll have a trusted certificate with no browser warnings!

## Option 3: Using a Reverse Proxy (ngrok)

For quick HTTPS tunneling without certificates:

1. **Install ngrok**:
   ```bash
   # Download from https://ngrok.com/download
   # Or using package manager
   ```

2. **Start your app** (on HTTP):
   ```bash
   cd client
   npm start
   ```

3. **In another terminal, start ngrok**:
   ```bash
   ngrok http 3000
   ```

4. **Update Azure AD Redirect URI** to the ngrok URL (e.g., `https://abc123.ngrok.io`)

**Note**: Free ngrok URLs change on restart. For development, consider a paid plan with a fixed domain.

## Option 4: Production Deployment

For production, you'll need proper SSL certificates. Here are popular options:

### Azure Static Web Apps
- Automatically provides HTTPS
- Free SSL certificate included
- Perfect for React apps

### Netlify
- Automatic HTTPS with Let's Encrypt
- Free tier available
- Easy deployment

### Vercel
- Automatic HTTPS
- Free tier available
- Great for React apps

### Custom Server (Node.js/Express)
If you need a custom server, use:
- **Let's Encrypt** for free SSL certificates
- **Cloudflare** for free SSL proxy
- **AWS Certificate Manager** (if using AWS)

## Updating Azure AD Configuration

When switching to HTTPS, update your Azure AD app registration:

1. Go to **Azure Portal** → **App registrations** → Your app
2. Go to **Authentication**
3. Under **Single-page application**, update/add:
   - `https://localhost:3000` (for local development)
   - `https://yourdomain.com` (for production)
4. Save changes

## Troubleshooting

### Certificate Errors
- **Self-signed certificate warning**: This is normal for local development. Accept it or use mkcert.
- **NET::ERR_CERT_AUTHORITY_INVALID**: Use mkcert to create trusted certificates.

### CORS Issues
- Microsoft Graph API supports CORS for HTTPS origins
- Ensure your redirect URI in Azure AD matches exactly (including https://)

### Port Issues
- If port 3000 is in use, React will ask to use another port
- Update Azure AD redirect URI to match the new port

## Quick Reference

```bash
# Development with HTTPS (self-signed)
cd client
HTTPS=true npm start

# Development with HTTPS (trusted cert via mkcert)
cd client
npm run start:https

# Production build
cd client
npm run build
# Deploy the 'build' folder to your hosting service
```

