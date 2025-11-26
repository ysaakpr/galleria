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
import ConfigModal from './components/ConfigModal'
import UploadProgress from './components/UploadProgress'
import SyncWarning from './components/SyncWarning'
import ReloadToast from './components/ReloadToast'
import { Button } from './components/ui/button'
import { useGalleryStore } from './store/galleryStore'

function App() {
  const { isAuthenticated, user } = useAuth()
  const [currentView, setCurrentView] = useState('photos')
  const [showConfig, setShowConfig] = useState(false)
  const [showSyncWarning, setShowSyncWarning] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string
    progress: number
    status: string
  } | null>(null)
  
  const { photos, fetchPhotos } = useGalleryStore()
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  useEffect(() => {
    // Initialize database on startup
    invoke('init_database').catch(console.error)
  }, [])

  useEffect(() => {
    // Listen for upload progress
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

  useEffect(() => {
    if (isAuthenticated && user?.hasS3Config) {
      fetchPhotos(true) // Use cache first
    }
  }, [isAuthenticated, user?.hasS3Config, fetchPhotos])

  // Show config modal if user logged in but no S3 config
  useEffect(() => {
    if (isAuthenticated && user && !user.hasS3Config) {
      setShowConfig(true)
    }
  }, [isAuthenticated, user])

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

  if (!isAuthenticated) {
    return <Login />
  }

  // Show config modal immediately if no S3 config
  useEffect(() => {
    if (user && !user.hasS3Config && !showConfig) {
      setShowConfig(true)
    }
  }, [user, showConfig])

  // Listen for keyboard shortcut events
  useEffect(() => {
    let unlistenSettings: (() => void) | undefined

    const setupListeners = async () => {
      const appWindow = getCurrentWindow()
      
      // Listen for Cmd+, to open settings
      unlistenSettings = await appWindow.listen('open-settings', () => {
        setShowConfig(true)
      })
    }

    setupListeners()

    return () => {
      unlistenSettings?.()
    }
  }, [])

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
        {/* Sidebar */}
        {user?.hasS3Config && (
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            onOpenConfig={() => setShowConfig(true)}
          />
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {showSyncWarning && user?.accessToken && !user?.hasDriveAccess && (
            <SyncWarning 
              accessToken={user.accessToken} 
              onDismiss={() => setShowSyncWarning(false)} 
            />
          )}
          
          {!user?.hasS3Config ? (
            <div className="h-full flex items-center justify-center">
              <div className="glass-card max-w-md p-8 text-center animate-scale-in">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome, {user?.name}! 👋
                </h2>
                <p className="text-muted-foreground mb-6">
                  Let's connect your S3 storage to get started
                </p>
                <Button
                  onClick={() => setShowConfig(true)}
                  size="lg"
                  className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configure Storage
                </Button>
              </div>
            </div>
          ) : (
            <>
              {currentView === 'upload' && (
                <UploadView onUpload={handleUpload} />
              )}
              
              {currentView === 'photos' && (
                photos.length > 0 ? (
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
            </>
          )}
        </main>
      </div>

      {/* Upload Progress Toast */}
      {uploadProgress && <UploadProgress {...uploadProgress} />}
      
      {/* Reload Toast */}
      <ReloadToast />
      
      {/* Config Modal */}
      {showConfig && (
        <ConfigModal onClose={() => setShowConfig(false)} />
      )}
    </div>
  )
}

export default App

