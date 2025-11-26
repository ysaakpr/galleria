import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { open } from '@tauri-apps/plugin-dialog'
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

interface UploadViewProps {
  onUpload: (files: File[]) => void
}

export default function UploadView({ onUpload }: UploadViewProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.heic']
    },
    noClick: true,
  })

  const handleBrowse = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'heic']
        }]
      })
      
      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]
        const fileObjects = files.map(path => {
          const file = new File([], path)
          ;(file as any).path = path
          return file
        })
        onUpload(fileObjects)
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error)
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-8">
      <Card className="glass-card max-w-4xl w-full">
        <CardContent className="p-12">
          <div
            {...getRootProps()}
            className={`
              relative border-4 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer
              ${isDragActive 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
              }
            `}
          >
            <input {...getInputProps()} />
            
            {/* Icon */}
            <div className="relative inline-block mb-6">
              <div className={`
                p-8 rounded-3xl bg-gradient-to-br transition-all
                ${isDragActive 
                  ? 'from-primary-500 to-purple-600 scale-110' 
                  : 'from-primary-400 to-purple-500'
                }
              `}>
                {isDragActive ? (
                  <Sparkles className="w-20 h-20 text-white animate-pulse" />
                ) : (
                  <Upload className="w-20 h-20 text-white" />
                )}
              </div>
              
              {/* Floating icons for decoration */}
              {!isDragActive && (
                <>
                  <div className="absolute -top-2 -right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg animate-bounce delay-100">
                    <ImageIcon className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg animate-bounce delay-300">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </div>
                </>
              )}
            </div>

            {/* Text */}
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
              {isDragActive ? 'Drop your photos here!' : 'Upload Your Photos'}
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {isDragActive 
                ? 'Release to start uploading' 
                : 'Drag and drop your photos here, or click the button below to browse'
              }
            </p>

            {/* Browse Button */}
            <Button
              onClick={handleBrowse}
              size="lg"
              className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white text-lg px-8 py-6 shadow-xl"
            >
              <ImageIcon className="w-6 h-6 mr-2" />
              Browse Files
            </Button>

            {/* Supported formats */}
            <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">PNG</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">JPG</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">GIF</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">WebP</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">HEIC</span>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="w-12 h-12 mx-auto mb-2 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Compression</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">5 optimized sizes</p>
            </div>
            
            <div className="p-4">
              <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cloud Storage</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your S3 bucket</p>
            </div>
            
            <div className="p-4">
              <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Lightning Fast</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Batch upload</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

