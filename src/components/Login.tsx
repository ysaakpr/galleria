import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { invoke } from '@tauri-apps/api/core'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { setUser } = useAuth()

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      console.error('No credential received')
      return
    }

    try {
      const session = await invoke<any>('google_login', {
        token: response.credential,
      })

      // Check Drive access
      let hasDriveAccess = false
      try {
        const driveStatus = await invoke<any>('check_drive_permission', {
          accessToken: response.credential,
        })
        hasDriveAccess = driveStatus.has_drive_access
      } catch (e) {
        console.warn('Could not check Drive access:', e)
      }

      setUser({
        userId: session.user_id,
        googleId: session.google_id,
        email: session.email,
        name: session.name,
        pictureUrl: session.picture_url,
        hasS3Config: session.has_s3_config,
        hasDriveAccess,
        accessToken: response.credential,
      })
    } catch (error) {
      console.error('Login failed:', error)
      alert('Login failed. Please try again.')
    }
  }

  const handleError = () => {
    console.error('Google login failed')
    alert('Google login failed. Please try again.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg
              className="w-20 h-20 text-primary-600"
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
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to Galleria
          </h1>
          <p className="text-gray-600">
            Your personal cloud photo gallery
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-800">Secure Storage</h3>
                <p className="text-sm text-gray-600">Photos stored in your own S3 bucket</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-800">Multi-Device Sync</h3>
                <p className="text-sm text-gray-600">Access from macOS, Windows, Android & iOS</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-800">Cost Optimized</h3>
                <p className="text-sm text-gray-600">Smart caching minimizes S3 requests</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <p className="text-xs text-center text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

