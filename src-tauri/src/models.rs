use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S3Config {
    pub bucket: String,
    pub region: String,
    pub access_key: String,
    pub secret_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhotoMetadata {
    pub id: String,
    pub original_name: String,
    pub upload_date: String,
    pub file_size: u64,
    pub thumbnail_url: String,
    pub small_url: String,
    pub medium_url: String,
    pub large_url: String,
    pub original_url: String,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone)]
pub struct CompressedImage {
    pub size_name: String,
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
}

impl S3Config {
    #[allow(dead_code)]
    pub fn is_configured(&self) -> bool {
        !self.bucket.is_empty()
            && !self.region.is_empty()
            && !self.access_key.is_empty()
            && !self.secret_key.is_empty()
    }
}

