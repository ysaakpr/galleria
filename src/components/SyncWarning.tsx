import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface SyncWarningProps {
  accessToken: string
  onDismiss: () => void
}

export default function SyncWarning({ accessToken, onDismiss }: SyncWarningProps) {
  const [hasDriveAccess, setHasDriveAccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkDrivePermission()
  }, [accessToken])

  const checkDrivePermission = async () => {
    try {
      const status = await invoke<any>('check_drive_permission', { accessToken })
      setHasDriveAccess(status.has_drive_access)
    } catch (error) {
      console.error('Failed to check Drive permission:', error)
      setHasDriveAccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return null
  }

  if (hasDriveAccess) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-start space-x-3">
        <svg
          className="w-5 h-5 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="font-semibold">Cloud Sync Enabled</p>
          <p className="text-sm mt-1">
            Your settings and photo metadata are being synced to Google Drive for multi-device access.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
      <div className="flex items-start space-x-3">
        <svg
          className="w-5 h-5 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <p className="font-semibold">Google Drive Access Not Granted</p>
          <p className="text-sm mt-1">
            Your S3 credentials and photo metadata will <strong>only be saved locally</strong> on this device.
          </p>
          <p className="text-sm mt-2">
            To enable sync across multiple devices, you need to grant Google Drive access when logging in.
          </p>
          <details className="mt-3">
            <summary className="text-sm font-semibold cursor-pointer hover:underline">
              What this means
            </summary>
            <ul className="text-sm mt-2 space-y-1 ml-4 list-disc">
              <li>You'll need to re-enter your S3 credentials on each device</li>
              <li>Photo metadata won't sync between devices</li>
              <li>Each device will maintain its own local database</li>
              <li>Photos in S3 are still accessible, but you'll need to refresh the list on each device</li>
            </ul>
          </details>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={() => {
                alert('Please log out and log in again to grant Drive access')
              }}
              className="text-sm bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Grant Access
            </button>
            <button
              onClick={onDismiss}
              className="text-sm text-yellow-700 hover:text-yellow-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

