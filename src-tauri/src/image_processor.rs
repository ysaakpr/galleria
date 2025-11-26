use crate::models::CompressedImage;
use image::{imageops::FilterType, ImageFormat, GenericImageView};
use std::io::Cursor;

const THUMBNAIL_SIZE: u32 = 200;
const SMALL_SIZE: u32 = 640;
const MEDIUM_SIZE: u32 = 1280;
const LARGE_SIZE: u32 = 1920;

pub fn process_image(file_path: &str) -> Result<Vec<CompressedImage>, Box<dyn std::error::Error>> {
    let img = image::open(file_path)?;
    let (original_width, original_height) = img.dimensions();
    
    let mut compressed_images = Vec::new();
    
    // Generate thumbnail
    compressed_images.push(resize_and_compress(
        &img,
        THUMBNAIL_SIZE,
        "thumbnail",
        85,
    )?);
    
    // Generate small version (only if original is larger)
    if original_width > SMALL_SIZE || original_height > SMALL_SIZE {
        compressed_images.push(resize_and_compress(
            &img,
            SMALL_SIZE,
            "small",
            85,
        )?);
    }
    
    // Generate medium version (only if original is larger)
    if original_width > MEDIUM_SIZE || original_height > MEDIUM_SIZE {
        compressed_images.push(resize_and_compress(
            &img,
            MEDIUM_SIZE,
            "medium",
            90,
        )?);
    }
    
    // Generate large version (only if original is larger)
    if original_width > LARGE_SIZE || original_height > LARGE_SIZE {
        compressed_images.push(resize_and_compress(
            &img,
            LARGE_SIZE,
            "large",
            92,
        )?);
    }
    
    // Original (compressed but same dimensions)
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    img.write_to(&mut cursor, ImageFormat::Jpeg)?;
    
    compressed_images.push(CompressedImage {
        size_name: "original".to_string(),
        data: buffer,
        width: original_width,
        height: original_height,
    });
    
    Ok(compressed_images)
}

fn resize_and_compress(
    img: &image::DynamicImage,
    max_dimension: u32,
    size_name: &str,
    quality: u8,
) -> Result<CompressedImage, Box<dyn std::error::Error>> {
    let (width, height) = img.dimensions();
    
    // Calculate new dimensions maintaining aspect ratio
    let (new_width, new_height) = if width > height {
        let ratio = max_dimension as f32 / width as f32;
        (max_dimension, (height as f32 * ratio) as u32)
    } else {
        let ratio = max_dimension as f32 / height as f32;
        ((width as f32 * ratio) as u32, max_dimension)
    };
    
    // Resize image
    let resized = img.resize(new_width, new_height, FilterType::Lanczos3);
    
    // Compress to JPEG
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    
    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut cursor, quality);
    resized.write_with_encoder(encoder)?;
    
    Ok(CompressedImage {
        size_name: size_name.to_string(),
        data: buffer,
        width: new_width,
        height: new_height,
    })
}

