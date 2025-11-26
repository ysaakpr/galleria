import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Cmd+R (macOS) or Ctrl+R (Windows/Linux) - Reload
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault()
        
        try {
          const appWindow = getCurrentWindow()
          await appWindow.emit('reload-requested', {})
          
          // Reload the webview
          window.location.reload()
        } catch (error) {
          console.error('Failed to reload:', error)
        }
      }

      // Cmd+Q (macOS) or Ctrl+Q (Windows/Linux) - Quit (optional)
      if ((event.metaKey || event.ctrlKey) && event.key === 'q') {
        event.preventDefault()
        
        try {
          const appWindow = getCurrentWindow()
          await appWindow.close()
        } catch (error) {
          console.error('Failed to quit:', error)
        }
      }

      // Cmd+W (macOS) or Ctrl+W (Windows/Linux) - Close window
      if ((event.metaKey || event.ctrlKey) && event.key === 'w') {
        event.preventDefault()
        
        try {
          const appWindow = getCurrentWindow()
          await appWindow.close()
        } catch (error) {
          console.error('Failed to close window:', error)
        }
      }

      // Cmd+, (macOS) or Ctrl+, (Windows/Linux) - Open settings
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault()
        
        // Emit event that App.tsx can listen to
        const appWindow = getCurrentWindow()
        await appWindow.emit('open-settings', {})
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}

