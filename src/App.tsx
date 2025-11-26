import { useState, useEffect } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Header from './components/Header'
import Gallery from './components/Gallery'
import UploadZone from './components/UploadZone'
import ConfigModal from './components/ConfigModal'
import UploadProgress from './components/UploadProgress'
import SyncWarning from './components/SyncWarning'
import { useGalleryStore } from './store/galleryStore'

// Replace with your Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'

function App() {
  const { isAuthenticated, user } = useAuth()
  const [showConfig, setShowConfig] = useState(false)
  const [showSyncWarning, setShowSyncWarning] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string
    progress: number
    status: string
  } | null>(null)
  
  const { photos, fetchPhotos } = useGalleryStore()

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
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Login />
      </GoogleOAuthProvider>
    )
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gray-50">
        <Header onOpenConfig={() => setShowConfig(true)} />
        
        <main className="container mx-auto px-4 py-8">
          {showSyncWarning && user?.accessToken && (
            <SyncWarning 
              accessToken={user.accessToken} 
              onDismiss={() => setShowSyncWarning(false)} 
            />
          )}
          
          {!user?.hasS3Config ? (
            <div className="max-w-2xl mx-auto mt-20 text-center">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <svg
                  className="w-20 h-20 mx-auto text-primary-500 mb-4"
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
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome to Galleria, {user?.name}!
                </h2>
                <p className="text-gray-600 mb-6">
                  Configure your S3 storage to get started with your photo gallery
                </p>
                <button
                  onClick={() => setShowConfig(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Configure S3 Storage
                </button>
              </div>
            </div>
          ) : (
            <>
              <UploadZone onUpload={handleUpload} />
              <Gallery photos={photos} />
            </>
          )}
        </main>

        {uploadProgress && <UploadProgress {...uploadProgress} />}
        
        {showConfig && (
          <ConfigModal onClose={() => setShowConfig(false)} />
        )}
      </div>
    </GoogleOAuthProvider>
  )
}

export default App

