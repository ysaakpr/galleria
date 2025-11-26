import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function ReloadToast() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        setShow(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!show) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
      <div className="glass px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3">
        <RefreshCw className="w-5 h-5 text-primary-600 animate-spin" />
        <span className="font-medium">Reloading...</span>
      </div>
    </div>
  )
}

