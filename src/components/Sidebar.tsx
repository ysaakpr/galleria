import { useState } from 'react'
import { Image, Folder, Users, Upload, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

interface SidebarProps {
  currentView: string
  onViewChange: (view: string) => void
  onOpenConfig: () => void
}

export default function Sidebar({ currentView, onViewChange, onOpenConfig }: SidebarProps) {
  const menuItems = [
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'albums', label: 'Albums', icon: Folder },
    { id: 'people', label: 'People', icon: Users },
  ]

  return (
    <aside className="w-64 glass-card h-full flex flex-col">
      {/* Upload Button */}
      <div className="p-4">
        <Button
          onClick={() => onViewChange('upload')}
          className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg"
          size="lg"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Photos
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-left",
                  isActive
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary-600")} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Settings at bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={onOpenConfig}
          className="w-full justify-start"
        >
          <Settings className="w-5 h-5 mr-2" />
          Settings
        </Button>
      </div>
    </aside>
  )
}

