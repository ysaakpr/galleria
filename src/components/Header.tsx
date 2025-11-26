import { invoke } from '@tauri-apps/api/core'
import { LogOut } from 'lucide-react'
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
    <header className="glass-header sticky top-0 z-50 animate-slide-down">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between space-x-6">
          {/* Search Bar */}
          <SearchBar />
          
          {/* User Info & Actions */}
          <div className="flex items-center space-x-3">
            {user && (
              <div className="flex items-center space-x-3 glass-card px-4 py-2 rounded-full">
                {user.pictureUrl && (
                  <img
                    src={user.pictureUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-primary-200"
                  />
                )}
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  {user.hasDriveAccess && (
                    <Badge variant="secondary" className="text-xs h-5">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 18l2-2v7H3v-7l2 2 7-7 7 7z"/>
                      </svg>
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
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

