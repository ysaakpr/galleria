interface UploadProgressProps {
  fileName: string
  progress: number
  status: string
}

export default function UploadProgress({ fileName, progress, status }: UploadProgressProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-800">Uploading</h4>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-2 truncate">{fileName}</p>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-500">{status}</p>
    </div>
  )
}

