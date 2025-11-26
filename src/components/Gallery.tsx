import { useState } from 'react'
import { Photo, useGalleryStore } from '../store/galleryStore'
import PhotoModal from './PhotoModal'
import LazyImage from './LazyImage'

interface GalleryProps {
  photos: Photo[]
}

export default function Gallery({ photos }: GalleryProps) {
  const { setSelectedPhoto } = useGalleryStore()
  const [selectedPhoto, setLocalSelectedPhoto] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return (
      <div className="text-center py-20">
        <svg
          className="w-24 h-24 mx-auto text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No photos yet</h3>
        <p className="text-gray-500">Upload your first photo to get started</p>
      </div>
    )
  }

  const handlePhotoClick = (photo: Photo) => {
    setLocalSelectedPhoto(photo)
    setSelectedPhoto(photo)
  }

  const handleCloseModal = () => {
    setLocalSelectedPhoto(null)
    setSelectedPhoto(null)
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-200 aspect-square"
            onClick={() => handlePhotoClick(photo)}
          >
            <LazyImage
              photoId={photo.id}
              src={photo.thumbnail_url}
              alt={photo.original_name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              sizeType="thumbnail"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={handleCloseModal} />
      )}
    </>
  )
}

