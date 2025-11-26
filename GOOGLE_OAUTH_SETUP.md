# Google OAuth Setup Guide

Follow these steps to configure Google OAuth for Galleria.

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it "Galleria" (or any name you prefer)
4. Click "Create"

## 2. Enable Required APIs

1. In your project, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Google+ API** (for user info)
   - **Google Drive API** (for cloud sync)
3. Click on each and click "Enable"

## 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (or Internal if using Google Workspace)
   - App name: **Galleria**
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - **Scopes**: Click "Add or Remove Scopes" and add:
     - `openid`
     - `userinfo.email`
     - `userinfo.profile`
     - `https://www.googleapis.com/auth/drive.file` (for cloud sync)
   - Click "Update" then "Save and Continue"
   - Test users: Add your email (for testing)
   - Click "Save and Continue"

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Galleria Desktop App**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `tauri://localhost` (for Tauri)
   - Authorized redirect URIs:
     - `http://localhost:5173`
     - `tauri://localhost`
   - Click "Create"

5. Copy your **Client ID** (looks like: `123456789-abc...xyz.apps.googleusercontent.com`)

## 4. Configure Galleria

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   ```

3. Save the file

## 5. Test the Integration

1. Start the development server:
   ```bash
   npm run tauri:dev
   ```

2. Click "Sign in with Google"
3. Authorize the app
4. You should be logged in!

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure you added `http://localhost:5173` to authorized redirect URIs
- Clear browser cache and try again

### "This app isn't verified"
- This is normal for apps in testing mode
- Click "Advanced" → "Go to Galleria (unsafe)" during development
- For production, submit your app for verification

### "Access blocked: Galleria has not completed the Google verification process"
- Add your email to "Test users" in OAuth consent screen
- Or publish your app (requires verification)

## Production Deployment

For production builds:

1. Add your production domain to authorized origins:
   - `https://yourdomain.com`

2. Submit for verification if needed:
   - Go to "OAuth consent screen"
   - Click "Publish App"
   - Follow Google's verification process

3. Update CSP in `tauri.conf.json` if using custom domain

## Security Notes

- **Never commit your `.env` file to version control**
- Client ID is safe to expose in frontend code
- Client Secret is NOT needed for Tauri desktop apps
- Token verification happens on the backend (Rust)
- User credentials are stored locally in SQLite

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Tauri Security Best Practices](https://tauri.app/v1/guides/features/security)
- [React OAuth Google Docs](https://github.com/MomenSherif/react-oauth)

