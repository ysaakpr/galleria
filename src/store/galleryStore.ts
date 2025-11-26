import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

export interface Photo {
  id: string
  original_name: string
  upload_date: string
  file_size: number
  thumbnail_url: string
  small_url: string
  medium_url: string
  large_url: string
  original_url: string
  width: number
  height: number
}

interface GalleryState {
  photos: Photo[]
  isLoading: boolean
  selectedPhoto: Photo | null
  
  fetchPhotos: (useCache: boolean) => Promise<void>
  deletePhoto: (photoId: string) => Promise<void>
  setSelectedPhoto: (photo: Photo | null) => void
  getCachedImageUrl: (photoId: string, sizeType: string) => Promise<string | null>
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  photos: [],
  isLoading: false,
  selectedPhoto: null,

  fetchPhotos: async (useCache = true) => {
    set({ isLoading: true })
    try {
      const photos = await invoke<Photo[]>('list_photos', { useCache })
      set({ photos, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch photos:', error)
      set({ isLoading: false })
    }
  },

  deletePhoto: async (photoId: string) => {
    try {
      await invoke('delete_photo', { photoId })
      const photos = get().photos.filter((p) => p.id !== photoId)
      set({ photos, selectedPhoto: null })
    } catch (error) {
      console.error('Failed to delete photo:', error)
      throw error
    }
  },

  setSelectedPhoto: (photo) => set({ selectedPhoto: photo }),

  getCachedImageUrl: async (photoId: string, sizeType: string) => {
    try {
      const url = await invoke<string | null>('get_cached_image_url', {
        photoId,
        sizeType,
      })
      return url
    } catch (error) {
      console.error('Failed to get cached image URL:', error)
      return null
    }
  },
}))

