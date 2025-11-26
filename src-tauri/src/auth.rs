use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleUserInfo {
    pub id: String,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthSession {
    pub user_id: i64,
    pub google_id: String,
    pub email: String,
    pub name: String,
    pub picture_url: Option<String>,
    pub has_s3_config: bool,
    pub has_drive_access: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CloudConfig {
    pub bucket: String,
    pub region: String,
    pub access_key: String,
    pub secret_key: String,
    pub last_updated: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DriveFileMetadata {
    pub id: String,
    pub name: String,
}

pub async fn verify_google_token(token: &str) -> Result<GoogleUserInfo, String> {
    let client = reqwest::Client::new();
    
    let response = client
        .get("https://www.googleapis.com/oauth2/v3/userinfo")
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| format!("Failed to verify token: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Invalid token".to_string());
    }
    
    let user_info: GoogleUserInfo = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse user info: {}", e))?;
    
    Ok(user_info)
}

pub async fn check_drive_access(access_token: &str) -> bool {
    let client = reqwest::Client::new();
    
    // Try to access Drive API to check if permission is granted
    let response = client
        .get("https://www.googleapis.com/drive/v3/about?fields=user")
        .bearer_auth(access_token)
        .send()
        .await;
    
    match response {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

pub async fn save_config_to_drive(
    access_token: &str,
    config: &CloudConfig,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    // Search for existing config file
    let search_response = client
        .get("https://www.googleapis.com/drive/v3/files")
        .query(&[("q", "name='galleria_config.json' and trashed=false")])
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to search Drive: {}", e))?;
    
    let files: serde_json::Value = search_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse search results: {}", e))?;
    
    let config_json = serde_json::to_string(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    // Check if file exists
    if let Some(file_list) = files.get("files").and_then(|f| f.as_array()) {
        if let Some(existing_file) = file_list.first() {
            // Update existing file
            let file_id = existing_file["id"].as_str().unwrap_or("");
            
            let update_response = client
                .patch(&format!(
                    "https://www.googleapis.com/upload/drive/v3/files/{}?uploadType=media",
                    file_id
                ))
                .bearer_auth(access_token)
                .header("Content-Type", "application/json")
                .body(config_json)
                .send()
                .await
                .map_err(|e| format!("Failed to update config in Drive: {}", e))?;
            
            if !update_response.status().is_success() {
                return Err("Failed to update config in Drive".to_string());
            }
            
            return Ok(file_id.to_string());
        }
    }
    
    // Create new file
    let metadata = serde_json::json!({
        "name": "galleria_config.json",
        "mimeType": "application/json"
    });
    
    // First create the file metadata
    let create_response = client
        .post("https://www.googleapis.com/drive/v3/files")
        .bearer_auth(access_token)
        .json(&metadata)
        .send()
        .await
        .map_err(|e| format!("Failed to create file in Drive: {}", e))?;
    
    let created_file: serde_json::Value = create_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse create response: {}", e))?;
    
    let file_id = created_file["id"]
        .as_str()
        .ok_or("Failed to get file ID")?
        .to_string();
    
    // Upload the content
    client
        .patch(&format!(
            "https://www.googleapis.com/upload/drive/v3/files/{}?uploadType=media",
            file_id
        ))
        .bearer_auth(access_token)
        .header("Content-Type", "application/json")
        .body(config_json)
        .send()
        .await
        .map_err(|e| format!("Failed to upload config content: {}", e))?;
    
    Ok(file_id)
}

pub async fn load_config_from_drive(access_token: &str) -> Result<Option<CloudConfig>, String> {
    let client = reqwest::Client::new();
    
    // Search for config file
    let search_response = client
        .get("https://www.googleapis.com/drive/v3/files")
        .query(&[("q", "name='galleria_config.json' and trashed=false")])
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to search Drive: {}", e))?;
    
    let files: serde_json::Value = search_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse search results: {}", e))?;
    
    if let Some(file_list) = files.get("files").and_then(|f| f.as_array()) {
        if let Some(file) = file_list.first() {
            let file_id = file["id"].as_str().unwrap_or("");
            
            // Download file content
            let content_response = client
                .get(&format!(
                    "https://www.googleapis.com/drive/v3/files/{}?alt=media",
                    file_id
                ))
                .bearer_auth(access_token)
                .send()
                .await
                .map_err(|e| format!("Failed to download config: {}", e))?;
            
            let config: CloudConfig = content_response
                .json()
                .await
                .map_err(|e| format!("Failed to parse config: {}", e))?;
            
            return Ok(Some(config));
        }
    }
    
    Ok(None)
}

pub async fn save_metadata_to_drive(
    access_token: &str,
    metadata_json: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    // Search for existing metadata file
    let search_response = client
        .get("https://www.googleapis.com/drive/v3/files")
        .query(&[("q", "name='galleria_metadata.json' and trashed=false")])
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to search Drive: {}", e))?;
    
    let files: serde_json::Value = search_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse search results: {}", e))?;
    
    // Check if file exists and update, otherwise create
    if let Some(file_list) = files.get("files").and_then(|f| f.as_array()) {
        if let Some(existing_file) = file_list.first() {
            let file_id = existing_file["id"].as_str().unwrap_or("");
            
            client
                .patch(&format!(
                    "https://www.googleapis.com/upload/drive/v3/files/{}?uploadType=media",
                    file_id
                ))
                .bearer_auth(access_token)
                .header("Content-Type", "application/json")
                .body(metadata_json.to_string())
                .send()
                .await
                .map_err(|e| format!("Failed to update metadata: {}", e))?;
            
            return Ok(file_id.to_string());
        }
    }
    
    // Create new file
    let metadata = serde_json::json!({
        "name": "galleria_metadata.json",
        "mimeType": "application/json"
    });
    
    let create_response = client
        .post("https://www.googleapis.com/drive/v3/files")
        .bearer_auth(access_token)
        .json(&metadata)
        .send()
        .await
        .map_err(|e| format!("Failed to create metadata file: {}", e))?;
    
    let created_file: serde_json::Value = create_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse create response: {}", e))?;
    
    let file_id = created_file["id"]
        .as_str()
        .ok_or("Failed to get file ID")?
        .to_string();
    
    client
        .patch(&format!(
            "https://www.googleapis.com/upload/drive/v3/files/{}?uploadType=media",
            file_id
        ))
        .bearer_auth(access_token)
        .header("Content-Type", "application/json")
        .body(metadata_json.to_string())
        .send()
        .await
        .map_err(|e| format!("Failed to upload metadata content: {}", e))?;
    
    Ok(file_id)
}

pub async fn load_metadata_from_drive(access_token: &str) -> Result<Option<String>, String> {
    let client = reqwest::Client::new();
    
    let search_response = client
        .get("https://www.googleapis.com/drive/v3/files")
        .query(&[("q", "name='galleria_metadata.json' and trashed=false")])
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to search Drive: {}", e))?;
    
    let files: serde_json::Value = search_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse search results: {}", e))?;
    
    if let Some(file_list) = files.get("files").and_then(|f| f.as_array()) {
        if let Some(file) = file_list.first() {
            let file_id = file["id"].as_str().unwrap_or("");
            
            let content_response = client
                .get(&format!(
                    "https://www.googleapis.com/drive/v3/files/{}?alt=media",
                    file_id
                ))
                .bearer_auth(access_token)
                .send()
                .await
                .map_err(|e| format!("Failed to download metadata: {}", e))?;
            
            let content = content_response
                .text()
                .await
                .map_err(|e| format!("Failed to read metadata: {}", e))?;
            
            return Ok(Some(content));
        }
    }
    
    Ok(None)
}

