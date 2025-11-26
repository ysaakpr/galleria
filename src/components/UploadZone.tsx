import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { open } from '@tauri-apps/plugin-dialog'

interface UploadZoneProps {
  onUpload: (files: File[]) => void
}

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']
    },
    noClick: true,
  })

  const handleBrowse = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
        }]
      })
      
      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]
        // Convert file paths to File objects (Tauri specific)
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
    <div
      {...getRootProps()}
      className={`
        mb-8 border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
        ${isDragActive 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-gray-300 bg-white hover:border-primary-400 hover:bg-gray-50'
        }
      `}
    >
      <input {...getInputProps()} />
      
      <svg
        className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {isDragActive ? 'Drop your photos here' : 'Upload Photos'}
      </h3>
      
      <p className="text-gray-500 mb-4">
        Drag and drop your photos here, or click to browse
      </p>
      
      <button
        onClick={handleBrowse}
        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span>Browse Files</span>
      </button>
      
      <p className="text-sm text-gray-400 mt-4">
        Supports: PNG, JPG, JPEG, GIF, WebP, BMP
      </p>
    </div>
  )
}

