import { invoke } from '@tauri-apps/api/core'
import { LogOut, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import SearchBar from './SearchBar'

export default function Header() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await invoke('logout')
      logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="glass-header sticky top-0 z-50 animate-slide-down border-b border-white/10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between space-x-6">
          {/* Logo & Title */}
          <div className="flex items-center space-x-4 min-w-[240px]">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <ImageIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Galleria
              </h1>
              <p className="text-xs text-muted-foreground">Photo Gallery</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <SearchBar />
          
          {/* User Info & Actions */}
          <div className="flex items-center space-x-3 min-w-[240px] justify-end">
            {user && (
              <div className="flex items-center space-x-3 glass-card px-4 py-2.5 rounded-full">
                {user.pictureUrl && (
                  <img
                    src={user.pictureUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-primary-200 dark:ring-primary-800"
                  />
                )}
                <div className="hidden lg:block">
                  <p className="text-sm font-medium leading-tight">{user.name}</p>
                  {user.hasDriveAccess && (
                    <Badge variant="secondary" className="text-xs h-4 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                      Synced
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

