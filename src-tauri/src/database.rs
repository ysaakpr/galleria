use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub google_id: String,
    pub email: String,
    pub name: String,
    pub picture_url: Option<String>,
    pub s3_bucket: Option<String>,
    pub s3_region: Option<String>,
    pub s3_access_key: Option<String>,
    pub s3_secret_key: Option<String>,
    pub access_token: Option<String>,
    pub has_drive_access: i32,
    pub last_sync: Option<String>,
    pub created_at: String,
    pub last_login: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Photo {
    pub id: i64,
    pub user_id: i64,
    pub photo_id: String,
    pub original_name: String,
    pub upload_date: String,
    pub file_size: i64,
    pub thumbnail_url: String,
    pub small_url: String,
    pub medium_url: String,
    pub large_url: String,
    pub original_url: String,
    pub width: i32,
    pub height: i32,
    pub synced: i32,
    pub cache_timestamp: Option<String>,
}

pub const INIT_SQL: &str = r#"
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture_url TEXT,
    s3_bucket TEXT,
    s3_region TEXT,
    s3_access_key TEXT,
    s3_secret_key TEXT,
    access_token TEXT,
    has_drive_access INTEGER DEFAULT 0,
    last_sync TEXT,
    created_at TEXT NOT NULL,
    last_login TEXT NOT NULL
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    photo_id TEXT UNIQUE NOT NULL,
    original_name TEXT NOT NULL,
    upload_date TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    thumbnail_url TEXT NOT NULL,
    small_url TEXT NOT NULL,
    medium_url TEXT NOT NULL,
    large_url TEXT NOT NULL,
    original_url TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    synced INTEGER DEFAULT 1,
    cache_timestamp TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Image cache table for request optimization
CREATE TABLE IF NOT EXISTS image_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id TEXT NOT NULL,
    size_type TEXT NOT NULL,
    url TEXT NOT NULL,
    last_accessed TEXT NOT NULL,
    access_count INTEGER DEFAULT 1,
    UNIQUE(photo_id, size_type)
);

-- Sync status table
CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    last_config_sync TEXT,
    last_metadata_sync TEXT,
    sync_enabled INTEGER DEFAULT 1,
    pending_changes INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_photo_id ON photos(photo_id);
CREATE INDEX IF NOT EXISTS idx_photos_upload_date ON photos(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_synced ON photos(synced);
CREATE INDEX IF NOT EXISTS idx_image_cache_photo_id ON image_cache(photo_id);
CREATE INDEX IF NOT EXISTS idx_image_cache_access ON image_cache(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_sync_status_user_id ON sync_status(user_id);
"#;

pub fn get_db_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    
    Ok(app_data_dir.join("galleria.db"))
}

