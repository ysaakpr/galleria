# Cloud Sync Feature

## Overview

Galleria uses Google Drive to sync your S3 configuration and photo metadata across multiple devices. This enables a true multi-device experience where you can:

- Access your photo gallery from any device (macOS, Windows, future Android/iOS)
- Automatically sync S3 credentials
- Share photo metadata between devices
- Keep local SQLite database in sync with cloud

## How It Works

### Architecture

```
Device A (macOS)                    Google Drive                    Device B (Windows)
┌─────────────┐                    ┌──────────┐                    ┌─────────────┐
│  SQLite DB  │ ←─ Sync ──────────→│  2 Files │ ←─ Sync ──────────→│  SQLite DB  │
│             │                    │          │                    │             │
│ • Users     │                    │ • config │                    │ • Users     │
│ • Photos    │                    │ • metadata                    │ • Photos    │
│ • Cache     │                    └──────────┘                    │ • Cache     │
└─────────────┘                                                    └─────────────┘
```

### Files Stored in Google Drive

1. **`galleria_config.json`** - S3 credentials and settings
   ```json
   {
     "bucket": "my-galleria-bucket",
     "region": "us-east-1",
     "access_key": "AKIAIOSFODNN7EXAMPLE",
     "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
     "last_updated": "2024-01-01T00:00:00Z"
   }
   ```

2. **`galleria_metadata.json`** - Photo metadata index
   ```json
   [
     {
       "id": "uuid-1",
       "original_name": "photo1.jpg",
       "upload_date": "2024-01-01T00:00:00Z",
       "file_size": 1234567,
       "thumbnail_url": "https://...",
       "width": 1920,
       "height": 1080
     }
   ]
   ```

## Permission Levels

### With Google Drive Access (Recommended)

When you grant Drive access:

✅ **Multi-device sync enabled**
- S3 config syncs automatically
- Photo metadata syncs across devices
- Seamless experience on all devices
- One-time setup

✅ **Automatic sync**
- Config changes sync immediately
- New photos added on one device appear on all
- Deletions propagate to all devices

✅ **Offline support**
- Local SQLite cache works offline
- Syncs when back online

### Without Google Drive Access

If you deny Drive access:

⚠️ **Local-only mode**
- Config stored only on current device
- Must re-enter S3 credentials on each device
- Photo metadata not synced

⚠️ **Manual setup required**
- Configure S3 on each device
- Photos will load from S3 but slower
- No metadata cache sharing

## Security & Privacy

### What's Stored in Drive

**Stored:**
- S3 bucket configuration (encrypted in transit)
- Photo metadata (names, dates, sizes, URLs)

**NOT Stored:**
- Actual photos (stay in your S3 bucket)
- Google credentials
- Session tokens

### Drive File Permissions

- Files are stored in your Google Drive's **application data folder**
- Only Galleria app can access these files
- Files don't appear in your main Drive folder
- You can revoke access anytime in Google Account settings

### Encryption

- Files encrypted in transit (HTTPS)
- S3 credentials stored as-is (same as local storage)
- Consider using environment variables for extra security

## How to Enable/Disable

### Enable Cloud Sync

1. Log out of Galleria
2. Log back in with Google
3. Grant Google Drive permission when prompted
4. Configure S3 (will automatically sync to Drive)

### Disable Cloud Sync

1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find "Galleria"
3. Click "Remove Access"
4. App will continue working in local-only mode

## Sync Behavior

### When Config Changes

```
1. User updates S3 credentials
2. Save to local SQLite
3. If Drive access → Upload to Drive
4. Other devices check Drive on next launch
5. Download newer config if available
6. Update local SQLite
```

### When Photos Are Added

```
1. User uploads photo
2. Process & upload to S3
3. Save metadata to local SQLite
4. If Drive access → Sync metadata to Drive
5. Other devices pull updates on next refresh
```

### Conflict Resolution

If config conflicts (edited on multiple devices):
- **Newest timestamp wins**
- Local changes merged with remote
- User notified of conflicts

## Troubleshooting

### "Drive access not granted" warning

**Solution:**
- Log out and log in again
- Grant Drive permission when prompted
- Or continue in local-only mode

### Config not syncing

**Check:**
1. Drive access granted (see warning banner)
2. Internet connection active
3. Google Drive API enabled in Console
4. OAuth scopes include `drive.file`

### Photos not appearing on other device

**Steps:**
1. Check if Drive sync is enabled
2. Click refresh/reload photos
3. Verify internet connection
4. Check sync status in settings

### How to manually sync

```
1. Open app on Device A
2. Make changes (add/delete photos)
3. Wait 2-3 seconds for auto-sync
4. Open app on Device B
5. Pull to refresh or restart app
6. Changes should appear
```

## API Quotas

Google Drive API has the following free quotas:
- **Queries per day**: 1 billion
- **Queries per 100 seconds per user**: 1,000

For typical personal use:
- Config syncs: ~10/day
- Metadata syncs: ~100/day (after uploads)
- **Well within free limits**

## Future Enhancements

### Planned Features

- [ ] Real-time sync (WebSocket)
- [ ] Selective sync (choose devices)
- [ ] Sync conflict UI
- [ ] Manual sync button
- [ ] Sync history/log
- [ ] Bandwidth optimization
- [ ] Delta sync (only changes)

### Mobile Apps

When Android/iOS apps launch:
- Same Google Drive files
- Same sync mechanism
- Seamless cross-platform experience

## FAQ

**Q: Can I use a different cloud provider?**
A: Currently only Google Drive. Dropbox/OneDrive support planned.

**Q: What if I delete the Drive files?**
A: Local database remains intact. Re-sync will recreate files.

**Q: Can I share my config with others?**
A: No, Drive files are private. Each user has their own config.

**Q: Does this cost money?**
A: No, uses free Google Drive API quota.

**Q: Can I sync to multiple Google accounts?**
A: Each Google account has separate Drive files. Can't merge.

**Q: How often does it sync?**
A: Automatically after changes. Manual refresh also available.

**Q: What happens if Drive is down?**
A: App works normally with local database. Syncs when back online.

## Technical Details

### API Endpoints Used

```rust
// Check Drive access
GET https://www.googleapis.com/drive/v3/about

// Search for config file
GET https://www.googleapis.com/drive/v3/files?q=name='galleria_config.json'

// Upload config
PATCH https://www.googleapis.com/upload/drive/v3/files/{fileId}

// Download config
GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media
```

### OAuth Scope Required

```
https://www.googleapis.com/auth/drive.file
```

This scope allows:
- Creating files in app-specific folder
- Reading files created by the app
- Updating files created by the app
- Deleting files created by the app

Does NOT allow:
- Access to other Drive files
- Access to Drive folders
- Sharing files with others

## Support

For issues:
- Check `GOOGLE_OAUTH_SETUP.md` for OAuth setup
- Verify Drive API is enabled
- Check app logs for sync errors
- Open GitHub issue with details

---

**Remember**: Cloud sync is optional but recommended for the best multi-device experience!

