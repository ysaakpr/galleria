import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from './ui/button'

export default function SearchBar() {
  return (
    <div className="flex items-center space-x-3 flex-1 max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search photos, albums, people..."
          className="w-full pl-10 pr-4 py-2.5 glass-card border-0 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        />
      </div>
      <Button variant="glass" size="icon">
        <SlidersHorizontal className="w-5 h-5" />
      </Button>
    </div>
  )
}

