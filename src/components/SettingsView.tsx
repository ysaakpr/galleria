import { useState } from 'react'
import { Cloud, HardDrive, Shield, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import ConfigModal from './ConfigModal'
import SyncWarning from './SyncWarning'
import { useAuth } from '../hooks/useAuth'

export default function SettingsView() {
  const [showConfigModal, setShowConfigModal] = useState(false)
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your storage and account settings</p>
      </div>

      {/* Google Drive Sync Warning */}
      {user?.accessToken && !user?.hasDriveAccess && (
        <SyncWarning 
          accessToken={user.accessToken} 
          onDismiss={() => {}}
        />
      )}

      {/* S3 Storage Configuration */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Cloud className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <CardTitle>S3 Storage</CardTitle>
                <CardDescription>Configure your Amazon S3 bucket for photo storage</CardDescription>
              </div>
            </div>
            {user?.hasS3Config && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!user?.hasS3Config ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-1">
                    S3 Storage Not Configured
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    You need to configure your S3 storage credentials before you can upload and store photos.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-green-900 dark:text-green-300 mb-1">
                    S3 Storage Connected
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Your S3 bucket is configured and ready to store photos.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => setShowConfigModal(true)}
            variant="outline"
            className="w-full"
          >
            {user?.hasS3Config ? 'Update S3 Configuration' : 'Configure S3 Storage'}
          </Button>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your account information and preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</p>
                <p className="text-sm text-muted-foreground">{user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Google Drive Sync</p>
                <p className="text-sm text-muted-foreground">
                  {user?.hasDriveAccess 
                    ? 'Enabled - Your settings are backed up' 
                    : 'Not enabled - Configure to sync across devices'
                  }
                </p>
              </div>
              <Badge variant={user?.hasDriveAccess ? 'secondary' : 'outline'}>
                {user?.hasDriveAccess ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <HardDrive className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Storage</CardTitle>
              <CardDescription>Your photo storage information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-3xl font-bold text-primary-600">Your S3 Bucket</p>
            <p className="text-sm text-muted-foreground mt-2">
              All photos are stored in your personal S3 bucket
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              💡 Tip: You control the costs by managing your own AWS S3 bucket
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Config Modal */}
      {showConfigModal && (
        <ConfigModal onClose={() => setShowConfigModal(false)} />
      )}
    </div>
  )
}

