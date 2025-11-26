# Quick Start Guide

Get Galleria running in 10 minutes!

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Rust installed ([Install](https://rustup.rs/))
- [ ] Google account (for login)
- [ ] AWS account (for S3 storage)
- [ ] 10 minutes of free time

## Step 1: Clone & Install (2 min)

```bash
cd galleria
npm install
```

Wait for dependencies to install...

## Step 2: Google OAuth Setup (3 min)

### A. Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click "New Project" → Name it "Galleria" → Create
3. Wait for project to be created

### B. Enable Required APIs

1. In project, go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Google+ API** (for user authentication)
   - **Google Drive API** (for cloud sync across devices)
3. Click on each → Click "Enable"

### C. Create OAuth Client

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure consent screen (if prompted):
   - User Type: External
   - App name: Galleria
   - Your email for support
   - **Scopes**: Click "Add or Remove Scopes"
     - Add: `openid`, `userinfo.email`, `userinfo.profile`
     - Add: `https://www.googleapis.com/auth/drive.file` (for sync)
   - Save and Continue through all steps
4. Create OAuth Client ID:
   - Type: Web application
   - Name: Galleria
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
   - Click Create
5. **Copy the Client ID** (looks like: `123...xyz.apps.googleusercontent.com`)

### D. Add Client ID to Project

```bash
cp .env.example .env
nano .env  # or use your favorite editor
```

Paste your Client ID:
```
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

Save and close.

## Step 3: AWS S3 Setup (3 min)

### A. Create S3 Bucket

1. Go to https://s3.console.aws.amazon.com/
2. Click "Create bucket"
3. Settings:
   - Bucket name: `galleria-photos-YOURNAME` (must be unique)
   - Region: Choose closest to you
   - **Uncheck** "Block all public access"
   - Check the warning acknowledgment
   - Create bucket

### B. Configure CORS

1. Click on your bucket → "Permissions" tab
2. Scroll to "Cross-origin resource sharing (CORS)"
3. Click "Edit" → Paste this:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Click "Save changes"

### C. Set Bucket Policy

1. Still in "Permissions" tab
2. Scroll to "Bucket policy" → Click "Edit"
3. Paste (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/photos/*"
    }
  ]
}
```

Click "Save changes"

### D. Create IAM User

1. Go to https://console.aws.amazon.com/iam/
2. Users → "Add users"
3. Username: `galleria-app`
4. Select "Access key - Programmatic access"
5. Permissions: Click "Attach existing policies directly"
6. Search and select `AmazonS3FullAccess` (or use custom policy)
7. Next → Create user
8. **IMPORTANT**: Copy these:
   - Access Key ID
   - Secret Access Key
9. Store them safely (you'll need them in the app)

## Step 4: Run Galleria (2 min)

```bash
npm run tauri:dev
```

Wait for compilation (first time takes a minute)...

## Step 5: First Login & Configuration (1 min)

1. App opens → Click "Sign in with Google"
2. Select your Google account → **Grant all permissions** (including Drive for cloud sync)
3. If you see "Google Drive Access Not Granted" warning:
   - **Recommended**: Log out and log in again to grant Drive access
   - **Or**: Continue without Drive (local-only mode)
4. Welcome screen → Click "Configure S3 Storage"
5. Enter your S3 details:
   - Bucket name (from Step 3A)
   - Region (from Step 3A)
   - Access Key ID (from Step 3D)
   - Secret Access Key (from Step 3D)
6. Click "Save Configuration"
   - If Drive access granted: Config automatically syncs to cloud ✨
   - If not granted: Config saved locally only

## Step 6: Upload Your First Photo! 🎉

1. Drag & drop a photo, or click "Browse Files"
2. Select one or more photos
3. Watch the upload progress
4. See your photos in the gallery!

---

## 🎊 You're Done!

Your photo gallery is now running with:
- ✅ Google authentication
- ✅ Your own S3 storage
- ✅ Smart caching (saves money)
- ✅ Multiple size versions
- ✅ Cross-platform database
- ✅ Cloud sync (if Drive access granted)
- ✅ Multi-device support

## Next Steps

- Upload more photos
- Test the photo viewer (click any photo)
- Try deleting a photo
- Close and reopen app (photos load instantly from cache!)

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Check that you added `http://localhost:5173` to Google OAuth authorized URIs

### "Failed to upload to S3"
- Verify your Access Key and Secret Key are correct
- Check bucket name is spelled correctly
- Ensure IAM user has S3 permissions

### "This app isn't verified"
- Normal during development
- Click "Advanced" → "Go to Galleria (unsafe)"
- Add yourself as test user in Google Cloud Console

### App won't compile
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
cd src-tauri && cargo clean && cd ..
npm run tauri:dev
```

## Cost Estimate

For personal use (1 user, 10,000 photos):
- Storage: ~$2.30/month
- Requests (with caching): ~$0.40/month
- **Total: ~$2.70/month**

Without caching: ~$42/month (you save 94%!)

## Support

- 📖 Full docs: `README.md`
- 🔧 Setup guide: `SETUP.md`
- 🔐 OAuth details: `GOOGLE_OAUTH_SETUP.md`
- 🐛 Issues: GitHub Issues

Enjoy your photo gallery! 📸

