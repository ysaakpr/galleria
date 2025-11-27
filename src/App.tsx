import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useAuth } from './hooks/useAuth'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import Login from './components/Login'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Gallery from './components/Gallery'
import UploadView from './components/UploadView'
import EmptyState from './components/EmptyState'
import SettingsView from './components/SettingsView'
import UploadProgress from './components/UploadProgress'
import ReloadToast from './components/ReloadToast'
import { useGalleryStore } from './store/galleryStore'

function App() {
  const { isAuthenticated, user } = useAuth()
  const [currentView, setCurrentView] = useState('photos')
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string
    progress: number
    status: string
  } | null>(null)
  
  const { photos, fetchPhotos } = useGalleryStore()
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // Initialize database on startup
  useEffect(() => {
    invoke('init_database').catch(console.error)
  }, [])

  // Listen for upload progress
  useEffect(() => {
    const unlisten = listen('upload-progress', (event: any) => {
      setUploadProgress(event.payload)
      if (event.payload.progress === 100) {
        setTimeout(() => setUploadProgress(null), 2000)
      }
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  // Fetch photos when authenticated and S3 is configured
  useEffect(() => {
    if (isAuthenticated && user?.hasS3Config) {
      fetchPhotos(true) // Use cache first
    }
  }, [isAuthenticated, user?.hasS3Config, fetchPhotos])

  // Listen for keyboard shortcut events
  useEffect(() => {
    if (!isAuthenticated) return // Skip if not authenticated

    let unlistenSettings: (() => void) | undefined

    const setupListeners = async () => {
      const appWindow = getCurrentWindow()
      
      // Listen for Cmd+, to open settings
      unlistenSettings = await appWindow.listen('open-settings', () => {
        setCurrentView('settings')
      })
    }

    setupListeners()

    return () => {
      unlistenSettings?.()
    }
  }, [isAuthenticated])

  const handleUpload = async (files: File[]) => {
    const filePaths = files.map((f) => (f as any).path || f.name)
    try {
      await invoke('upload_photos', { files: filePaths })
      await fetchPhotos(false) // Refresh from S3
      setCurrentView('photos') // Return to photos view after upload
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error}`)
    }
  }

  // Render login if not authenticated
  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <Header />
      
      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar - Always show */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {currentView === 'upload' && (
            <UploadView 
              onUpload={handleUpload}
              onNavigateToSettings={() => setCurrentView('settings')}
            />
          )}
          
          {currentView === 'photos' && (
            photos.length > 0 && user?.hasS3Config ? (
              <Gallery photos={photos} />
            ) : (
              <EmptyState view="photos" onUpload={() => setCurrentView('upload')} />
            )
          )}
          
          {currentView === 'albums' && (
            <EmptyState view="albums" onUpload={() => setCurrentView('upload')} />
          )}
          
          {currentView === 'people' && (
            <EmptyState view="people" onUpload={() => setCurrentView('upload')} />
          )}
          
          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Upload Progress Toast */}
      {uploadProgress && <UploadProgress {...uploadProgress} />}
      
      {/* Reload Toast */}
      <ReloadToast />
    </div>
  )
}

export default App

