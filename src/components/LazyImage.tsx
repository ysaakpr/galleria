import { useState, useEffect, useRef } from 'react'
import { useGalleryStore } from '../store/galleryStore'

interface LazyImageProps {
  photoId: string
  src: string
  alt: string
  className?: string
  sizeType?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original'
  loading?: 'lazy' | 'eager'
}

export default function LazyImage({
  photoId,
  src,
  alt,
  className = '',
  sizeType = 'thumbnail',
  loading = 'lazy',
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const { getCachedImageUrl } = useGalleryStore()

  useEffect(() => {
    let mounted = true

    const loadImage = async () => {
      try {
        // First, try to get from cache
        const cachedUrl = await getCachedImageUrl(photoId, sizeType)
        
        if (mounted) {
          setImageSrc(cachedUrl || src)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to load cached image:', err)
        if (mounted) {
          setImageSrc(src)
          setIsLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      mounted = false
    }
  }, [photoId, src, sizeType, getCachedImageUrl])

  const handleError = () => {
    setError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div className={`bg-gray-200 animate-pulse ${className}`} />
      )}
      <img
        ref={imgRef}
        src={imageSrc || undefined}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  )
}

