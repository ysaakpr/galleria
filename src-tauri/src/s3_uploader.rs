use crate::models::{CompressedImage, PhotoMetadata, S3Config};
use aws_config::meta::region::RegionProviderChain;
use aws_config::BehaviorVersion;
use aws_sdk_s3::{Client, primitives::ByteStream};
use chrono::Utc;
use uuid::Uuid;

pub async fn upload_to_s3(
    config: &S3Config,
    original_file_path: &str,
    compressed_images: Vec<CompressedImage>,
) -> Result<PhotoMetadata, Box<dyn std::error::Error>> {
    let client = create_s3_client(config).await?;
    
    let photo_id = Uuid::new_v4().to_string();
    let original_name = std::path::Path::new(original_file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown.jpg")
        .to_string();
    
    let mut metadata = PhotoMetadata {
        id: photo_id.clone(),
        original_name,
        upload_date: Utc::now().to_rfc3339(),
        file_size: 0,
        thumbnail_url: String::new(),
        small_url: String::new(),
        medium_url: String::new(),
        large_url: String::new(),
        original_url: String::new(),
        width: 0,
        height: 0,
    };
    
    // Upload all compressed versions
    for compressed in compressed_images {
        let key = format!("photos/{}/{}.jpg", photo_id, compressed.size_name);
        
        client
            .put_object()
            .bucket(&config.bucket)
            .key(&key)
            .body(ByteStream::from(compressed.data.clone()))
            .content_type("image/jpeg")
            .send()
            .await?;
        
        let url = format!(
            "https://{}.s3.{}.amazonaws.com/{}",
            config.bucket, config.region, key
        );
        
        match compressed.size_name.as_str() {
            "thumbnail" => metadata.thumbnail_url = url,
            "small" => metadata.small_url = url,
            "medium" => metadata.medium_url = url,
            "large" => metadata.large_url = url,
            "original" => {
                metadata.original_url = url;
                metadata.file_size = compressed.data.len() as u64;
                metadata.width = compressed.width;
                metadata.height = compressed.height;
            }
            _ => {}
        }
    }
    
    // Store metadata in S3
    let metadata_key = format!("metadata/{}.json", photo_id);
    let metadata_json = serde_json::to_string(&metadata)?;
    
    client
        .put_object()
        .bucket(&config.bucket)
        .key(&metadata_key)
        .body(ByteStream::from(metadata_json.into_bytes()))
        .content_type("application/json")
        .send()
        .await?;
    
    Ok(metadata)
}

pub async fn list_photos(
    config: &S3Config,
) -> Result<Vec<PhotoMetadata>, Box<dyn std::error::Error>> {
    let client = create_s3_client(config).await?;
    
    let response = client
        .list_objects_v2()
        .bucket(&config.bucket)
        .prefix("metadata/")
        .send()
        .await?;
    
    let mut photos = Vec::new();
    
    let contents = response.contents();
    if !contents.is_empty() {
        for object in contents {
            if let Some(key) = object.key() {
                let get_response = client
                    .get_object()
                    .bucket(&config.bucket)
                    .key(key)
                    .send()
                    .await?;
                
                let body = get_response.body.collect().await?;
                let metadata: PhotoMetadata = serde_json::from_slice(&body.into_bytes())?;
                photos.push(metadata);
            }
        }
    }
    
    // Sort by upload date (newest first)
    photos.sort_by(|a, b| b.upload_date.cmp(&a.upload_date));
    
    Ok(photos)
}

pub async fn delete_photo(
    config: &S3Config,
    photo_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let client = create_s3_client(config).await?;
    
    // Delete all photo sizes
    let sizes = vec!["thumbnail", "small", "medium", "large", "original"];
    for size in sizes {
        let key = format!("photos/{}/{}.jpg", photo_id, size);
        let _ = client
            .delete_object()
            .bucket(&config.bucket)
            .key(&key)
            .send()
            .await;
    }
    
    // Delete metadata
    let metadata_key = format!("metadata/{}.json", photo_id);
    client
        .delete_object()
        .bucket(&config.bucket)
        .key(&metadata_key)
        .send()
        .await?;
    
    Ok(())
}

async fn create_s3_client(config: &S3Config) -> Result<Client, Box<dyn std::error::Error>> {
    use aws_sdk_s3::config::Region;
    
    let region = Region::new(config.region.clone());
    let region_provider = RegionProviderChain::default_provider()
        .or_else(region);
    
    let sdk_config = aws_config::defaults(BehaviorVersion::latest())
        .region(region_provider)
        .credentials_provider(aws_sdk_s3::config::Credentials::new(
            &config.access_key,
            &config.secret_key,
            None,
            None,
            "galleria",
        ))
        .load()
        .await;
    
    Ok(Client::new(&sdk_config))
}

