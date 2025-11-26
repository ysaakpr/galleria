import { useState } from 'react'
import { Eye, Calendar } from 'lucide-react'
import { Photo, useGalleryStore } from '../store/galleryStore'
import PhotoModal from './PhotoModal'
import LazyImage from './LazyImage'
import { Badge } from './ui/badge'

interface GalleryProps {
  photos: Photo[]
}

export default function Gallery({ photos }: GalleryProps) {
  const { setSelectedPhoto } = useGalleryStore()
  const [selectedPhoto, setLocalSelectedPhoto] = useState<Photo | null>(null)

  const handlePhotoClick = (photo: Photo) => {
    setLocalSelectedPhoto(photo)
    setSelectedPhoto(photo)
  }

  const handleCloseModal = () => {
    setLocalSelectedPhoto(null)
    setSelectedPhoto(null)
  }

  // Group photos by date
  const groupedPhotos = photos.reduce((acc, photo) => {
    const date = new Date(photo.upload_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(photo)
    return acc
  }, {} as Record<string, Photo[]>)

  const dates = Object.keys(groupedPhotos).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <>
      {/* Gallery Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Photos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="glass-card">
            <Calendar className="w-3 h-3 mr-1" />
            Grouped by date
          </Badge>
        </div>
      </div>

      {/* Photos Grid by Date */}
      <div className="space-y-8">
        {dates.map(date => (
          <div key={date} className="animate-fade-in">
            {/* Date Header */}
            <div className="flex items-center mb-4">
              <div className="glass-card px-4 py-2 rounded-full">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {date}
                </p>
              </div>
              <div className="flex-1 ml-4 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {groupedPhotos[date].map((photo) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 aspect-square glass-card hover:scale-105 transition-all duration-300"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <LazyImage
                    photoId={photo.id}
                    src={photo.thumbnail_url}
                    alt={photo.original_name}
                    className="w-full h-full object-cover"
                    sizeType="thumbnail"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-medium truncate">
                        {photo.original_name}
                      </p>
                    </div>
                  </div>
                  
                  {/* View icon */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <div className="p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-xl">
                      <Eye className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={handleCloseModal} />
      )}
    </>
  )
}

