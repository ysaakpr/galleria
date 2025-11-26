# Galleria Setup Guide

## Quick Start

### 1. Install System Dependencies

#### macOS
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### Windows
1. Download and install [Node.js](https://nodejs.org/)
2. Install Rust: https://rustup.rs/
3. Install Visual Studio C++ Build Tools

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y nodejs npm curl build-essential libssl-dev pkg-config
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Clone and Setup Project

```bash
# Navigate to the project directory
cd galleria

# Install Node dependencies
npm install

# Verify Tauri installation
npm run tauri --version
```

### 3. AWS S3 Setup

#### Create S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `my-galleria-photos`)
4. Select a region close to you
5. **Uncheck** "Block all public access" (we need public read for images)
6. Click "Create bucket"

#### Configure Bucket CORS

1. Click on your bucket
2. Go to "Permissions" tab
3. Scroll to "Cross-origin resource sharing (CORS)"
4. Click "Edit" and paste:

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

#### Set Bucket Policy (Public Read for Photos)

1. In "Permissions" tab, scroll to "Bucket policy"
2. Click "Edit" and paste (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/photos/*"
    }
  ]
}
```

#### Create IAM User with S3 Access

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Add users"
3. Username: `galleria-app` (or any name)
4. Select "Access key - Programmatic access"
5. Attach policy: `AmazonS3FullAccess` (or create custom policy below)
6. Click through to create user
7. **Save the Access Key ID and Secret Access Key**

**Custom IAM Policy (More Secure):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```

### 4. Run the Application

```bash
# Development mode (with hot reload)
npm run tauri:dev
```

On first launch:
1. Click "Configure S3 Storage"
2. Enter your:
   - Bucket name
   - Region
   - Access Key ID
   - Secret Access Key
3. Click "Save Configuration"

### 5. Build for Production

```bash
# Build the application
npm run tauri:build

# macOS: App will be in src-tauri/target/release/bundle/macos/
# Windows: App will be in src-tauri/target/release/bundle/msi/
# Linux: App will be in src-tauri/target/release/bundle/appimage/
```

## Remote Static Server Setup (Optional)

If you want to serve the frontend from a CDN or static host:

### 1. Build Frontend

```bash
npm run build
```

### 2. Upload to Static Host

#### Using AWS S3 + CloudFront

```bash
# Create a separate bucket for the static files
aws s3 mb s3://galleria-static

# Enable static website hosting
aws s3 website s3://galleria-static --index-document index.html

# Upload the built files
aws s3 sync dist/ s3://galleria-static/ --acl public-read

# Create CloudFront distribution (optional, for HTTPS + CDN)
# Follow AWS CloudFront documentation
```

#### Using Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd dist
netlify deploy --prod
```

#### Using Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd dist
vercel --prod
```

### 3. Update Tauri Configuration

Edit `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "devUrl": "https://your-cdn-url.com",
    "beforeBuildCommand": "",
    "frontendDist": "../dist"
  }
}
```

**Note:** For production, keeping the frontend bundled (default) provides better performance and offline support.

## Troubleshooting

### "Command not found: tauri"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Rust Compilation Errors

```bash
# Update Rust
rustup update

# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri:dev
```

### S3 Upload Fails

- Verify IAM user has correct permissions
- Check bucket exists in the specified region
- Ensure bucket name is correct (no typos)
- Verify Access Key ID and Secret Key are correct

### Images Don't Load

- Check bucket policy allows public read
- Verify CORS is configured correctly
- Open browser dev tools and check for CORS errors
- Ensure image URLs are accessible (try opening in browser)

### App Performance Issues

- Check available disk space
- Ensure you're not uploading extremely large files (>50MB)
- Try closing and reopening the app
- Clear browser cache (in dev mode)

## Development Tips

### Hot Reload

The frontend supports hot reload. Just save your files and changes will appear instantly.

### Debugging Rust Code

Add debug prints:
```rust
println!("Debug: {:?}", variable);
```

Or use the logger:
```rust
log::info!("Info message");
log::error!("Error message");
```

### Testing S3 Integration

Use AWS CLI to verify uploads:
```bash
# List objects in bucket
aws s3 ls s3://your-bucket-name/photos/ --recursive

# Download a photo
aws s3 cp s3://your-bucket-name/photos/some-id/thumbnail.jpg ./test.jpg
```

## Next Steps

- Customize the UI in `src/components/`
- Add more image processing features in `src-tauri/src/image_processor.rs`
- Implement search/tagging functionality
- Add photo editing capabilities
- Set up automated backups

## Getting Help

- Check the [README.md](README.md) for architecture details
- Open an issue on GitHub
- Review Tauri documentation: https://tauri.app/
- AWS S3 documentation: https://docs.aws.amazon.com/s3/

Happy photo organizing! 📸

