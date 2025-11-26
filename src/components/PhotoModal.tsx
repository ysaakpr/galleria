import { useState } from 'react'
import { X, Trash2, Download, Share2, Info } from 'lucide-react'
import { Photo, useGalleryStore } from '../store/galleryStore'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface PhotoModalProps {
  photo: Photo
  onClose: () => void
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const { deletePhoto } = useGalleryStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePhoto(photo.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete photo:', error)
      alert('Failed to delete photo')
    }
    setIsDeleting(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass max-w-7xl w-full max-h-[95vh] flex flex-col rounded-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="glass-header flex items-center justify-between p-4">
          <div className="flex items-center space-x-3 flex-1 mr-4">
            <h3 className="text-lg font-semibold truncate">
              {photo.original_name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {photo.width} × {photo.height}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInfo(!showInfo)}
              className="rounded-full"
            >
              <Info className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Download className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full text-destructive hover:text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main content with image and optional info panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Image */}
          <div className="flex-1 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6">
            <img
              src={photo.large_url || photo.original_url}
              alt={photo.original_name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Info Panel */}
          {showInfo && (
            <div className="w-80 glass-card p-6 overflow-auto animate-slide-right">
              <h4 className="font-semibold text-lg mb-4">Photo Details</h4>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Dimensions</span>
                  <p className="font-medium text-lg">{photo.width} × {photo.height}</p>
                </div>
                
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">File Size</span>
                  <p className="font-medium text-lg">{formatFileSize(photo.file_size)}</p>
                </div>
                
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Uploaded</span>
                  <p className="font-medium">{formatDate(photo.upload_date)}</p>
                </div>
                
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Format</span>
                  <p className="font-medium">JPEG (Optimized)</p>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Available Sizes</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">Thumbnail</Badge>
                    <Badge variant="outline">Small</Badge>
                    <Badge variant="outline">Medium</Badge>
                    <Badge variant="outline">Large</Badge>
                    <Badge variant="outline">Original</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Photo?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete "{photo.original_name}" from your gallery. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

