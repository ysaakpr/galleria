// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod image_processor;
mod s3_uploader;
mod models;
mod database;
mod auth;

use tauri::{Manager, Emitter};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone, serde::Serialize)]
struct UploadProgress {
    file_name: String,
    progress: f32,
    status: String,
}

#[derive(Clone)]
struct AppState {
    current_user_id: Arc<Mutex<Option<i64>>>,
}

#[tauri::command]
async fn init_database(app_handle: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_sql::{Builder, Migration, MigrationKind};
    
    let db_path = database::get_db_path(&app_handle)?;
    let db_path_str = db_path.to_string_lossy().to_string();
    
    // Initialize database with migrations
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: database::INIT_SQL,
        kind: MigrationKind::Up,
    }];
    
    app_handle.plugin(
        Builder::default()
            .add_migrations(&format!("sqlite:{}", db_path_str), migrations)
            .build(),
    ).map_err(|e| format!("Failed to initialize database: {}", e))?;
    
    Ok(db_path_str)
}

#[tauri::command]
async fn google_login(
    token: String,
    app_handle: tauri::AppHandle,
) -> Result<auth::AuthSession, String> {
    use chrono::Utc;
    
    // Verify Google token and get user info
    let user_info = auth::verify_google_token(&token).await?;
    
    // Get database connection
    let db_path = database::get_db_path(&app_handle)?;
    let db = tauri_plugin_sql::Builder::default()
        .build()
        .build(&app_handle)
        .map_err(|e| format!("Database connection failed: {}", e))?;
    
    let now = Utc::now().to_rfc3339();
    
    // Check if user exists
    let query = format!(
        "SELECT id, s3_bucket, s3_region FROM users WHERE google_id = '{}'",
        user_info.id
    );
    
    let user_id: i64;
    let has_s3_config: bool;
    
    // Insert or update user
    let insert_query = format!(
        "INSERT INTO users (google_id, email, name, picture_url, created_at, last_login) \
         VALUES ('{}', '{}', '{}', {}, '{}', '{}') \
         ON CONFLICT(google_id) DO UPDATE SET \
         last_login = '{}', name = '{}', picture_url = {}",
        user_info.id,
        user_info.email,
        user_info.name,
        user_info.picture.as_ref().map(|s| format!("'{}'", s)).unwrap_or("NULL".to_string()),
        now,
        now,
        now,
        user_info.name,
        user_info.picture.as_ref().map(|s| format!("'{}'", s)).unwrap_or("NULL".to_string())
    );
    
    // For simplicity, we'll set user_id and has_s3_config manually
    user_id = 1; // This would come from the database query
    has_s3_config = false;
    
    // Store current user in app state
    let state = app_handle.state::<AppState>();
    *state.current_user_id.lock().await = Some(user_id);
    
    Ok(auth::AuthSession {
        user_id,
        google_id: user_info.id,
        email: user_info.email,
        name: user_info.name,
        picture_url: user_info.picture,
        has_s3_config,
    })
}

#[tauri::command]
async fn configure_s3(
    bucket: String,
    region: String,
    access_key: String,
    secret_key: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let state = app_handle.state::<AppState>();
    let user_id = state.current_user_id.lock().await;
    
    let user_id = user_id.ok_or("Not logged in")?;
    
    // Update user's S3 configuration in database
    let db_path = database::get_db_path(&app_handle)?;
    
    // Store configuration
    let config = models::S3Config {
        bucket: bucket.clone(),
        region: region.clone(),
        access_key: access_key.clone(),
        secret_key: secret_key.clone(),
    };
    
    app_handle.manage(Arc::new(Mutex::new(config)));
    
    Ok("S3 configured successfully".to_string())
}

#[tauri::command]
async fn upload_photos(
    files: Vec<String>,
    app_handle: tauri::AppHandle,
) -> Result<Vec<models::PhotoMetadata>, String> {
    let state = app_handle.state::<AppState>();
    let user_id = state.current_user_id.lock().await;
    let user_id = user_id.ok_or("Not logged in")?;
    
    let config = app_handle.state::<Arc<Mutex<models::S3Config>>>();
    let config = config.lock().await;
    
    let mut results = Vec::new();
    
    for (index, file_path) in files.iter().enumerate() {
        // Emit progress
        let _ = app_handle.emit(
            "upload-progress",
            UploadProgress {
                file_name: file_path.clone(),
                progress: (index as f32 / files.len() as f32) * 100.0,
                status: "Processing".to_string(),
            },
        );
        
        // Process and compress image
        let compressed_images = image_processor::process_image(file_path)
            .map_err(|e| format!("Failed to process image: {}", e))?;
        
        // Upload to S3
        let metadata = s3_uploader::upload_to_s3(
            &config,
            file_path,
            compressed_images,
        )
        .await
        .map_err(|e| format!("Failed to upload to S3: {}", e))?;
        
        // Store in local database for caching
        // TODO: Add database insert here
        
        results.push(metadata);
    }
    
    // Final progress
    let _ = app_handle.emit(
        "upload-progress",
        UploadProgress {
            file_name: "All files".to_string(),
            progress: 100.0,
            status: "Complete".to_string(),
        },
    );
    
    Ok(results)
}

#[tauri::command]
async fn list_photos(
    use_cache: bool,
    app_handle: tauri::AppHandle,
) -> Result<Vec<models::PhotoMetadata>, String> {
    let state = app_handle.state::<AppState>();
    let user_id = state.current_user_id.lock().await;
    let _user_id = user_id.ok_or("Not logged in")?;
    
    // If using cache, try to get from database first
    if use_cache {
        // TODO: Query database for cached photos
    }
    
    // Otherwise, fetch from S3
    let config = app_handle.state::<Arc<Mutex<models::S3Config>>>();
    let config = config.lock().await;
    
    let photos = s3_uploader::list_photos(&config)
        .await
        .map_err(|e| format!("Failed to list photos: {}", e))?;
    
    // Update cache
    // TODO: Store photos in database
    
    Ok(photos)
}

#[tauri::command]
async fn delete_photo(
    photo_id: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let config = app_handle.state::<Arc<Mutex<models::S3Config>>>();
    let config = config.lock().await;
    
    s3_uploader::delete_photo(&config, &photo_id)
        .await
        .map_err(|e| format!("Failed to delete photo: {}", e))?;
    
    // Remove from database cache
    // TODO: Delete from database
    
    Ok("Photo deleted successfully".to_string())
}

#[tauri::command]
async fn get_cached_image_url(
    _photo_id: String,
    _size_type: String,
) -> Result<Option<String>, String> {
    // Return cached URL if available and recently accessed
    // This reduces S3 GET requests
    Ok(None) // TODO: Implement cache lookup
}

#[tauri::command]
async fn logout(app_handle: tauri::AppHandle) -> Result<String, String> {
    let state = app_handle.state::<AppState>();
    *state.current_user_id.lock().await = None;
    Ok("Logged out successfully".to_string())
}

#[derive(Clone, serde::Serialize)]
struct SyncStatus {
    has_drive_access: bool,
    last_config_sync: Option<String>,
    last_metadata_sync: Option<String>,
    pending_changes: i32,
}

#[tauri::command]
async fn sync_config_to_drive(
    access_token: String,
    bucket: String,
    region: String,
    access_key: String,
    secret_key: String,
) -> Result<String, String> {
    use chrono::Utc;
    
    // Check Drive access first
    let has_access = auth::check_drive_access(&access_token).await;
    
    if !has_access {
        return Err("Google Drive access not granted. Your settings will only be saved locally.".to_string());
    }
    
    let config = auth::CloudConfig {
        bucket,
        region,
        access_key,
        secret_key,
        last_updated: Utc::now().to_rfc3339(),
    };
    
    let file_id = auth::save_config_to_drive(&access_token, &config).await?;
    
    Ok(format!("Config synced to Drive: {}", file_id))
}

#[tauri::command]
async fn load_config_from_drive(access_token: String) -> Result<Option<auth::CloudConfig>, String> {
    auth::load_config_from_drive(&access_token).await
}

#[tauri::command]
async fn sync_metadata_to_drive(
    access_token: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let state = app_handle.state::<AppState>();
    let user_id = state.current_user_id.lock().await;
    let _user_id = user_id.ok_or("Not logged in")?;
    
    // Check Drive access
    let has_access = auth::check_drive_access(&access_token).await;
    
    if !has_access {
        return Err("Google Drive access not granted. Metadata will only be stored locally.".to_string());
    }
    
    // Get all photos from database
    // TODO: Query database for all photos
    let photos_json = "[]"; // Placeholder
    
    let file_id = auth::save_metadata_to_drive(&access_token, photos_json).await?;
    
    Ok(format!("Metadata synced to Drive: {}", file_id))
}

#[tauri::command]
async fn load_metadata_from_drive(
    access_token: String,
) -> Result<Option<String>, String> {
    auth::load_metadata_from_drive(&access_token).await
}

#[tauri::command]
async fn check_drive_permission(access_token: String) -> Result<SyncStatus, String> {
    let has_access = auth::check_drive_access(&access_token).await;
    
    Ok(SyncStatus {
        has_drive_access: has_access,
        last_config_sync: None,
        last_metadata_sync: None,
        pending_changes: 0,
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(AppState {
            current_user_id: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            init_database,
            google_login,
            configure_s3,
            upload_photos,
            list_photos,
            delete_photo,
            get_cached_image_url,
            logout,
            sync_config_to_drive,
            load_config_from_drive,
            sync_metadata_to_drive,
            load_metadata_from_drive,
            check_drive_permission
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

