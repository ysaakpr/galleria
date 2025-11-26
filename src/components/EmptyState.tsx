import { Image as ImageIcon, Upload } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

interface EmptyStateProps {
  view: string
  onUpload: () => void
}

export default function EmptyState({ view, onUpload }: EmptyStateProps) {
  const getContent = () => {
    switch (view) {
      case 'photos':
        return {
          icon: ImageIcon,
          title: 'No photos yet',
          description: 'Start building your photo library by uploading your first photos',
          action: 'Upload Photos',
        }
      case 'albums':
        return {
          icon: ImageIcon,
          title: 'No albums yet',
          description: 'Create albums to organize your photos',
          action: 'Create Album',
        }
      case 'people':
        return {
          icon: ImageIcon,
          title: 'No people detected',
          description: 'Upload photos with people to see them organized here',
          action: 'Upload Photos',
        }
      default:
        return {
          icon: ImageIcon,
          title: 'Nothing here',
          description: 'Start by uploading some photos',
          action: 'Upload',
        }
    }
  }

  const content = getContent()
  const Icon = content.icon

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="glass-card max-w-md">
        <CardContent className="p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl flex items-center justify-center">
            <Icon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            {content.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {content.description}
          </p>
          
          <Button
            onClick={onUpload}
            className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            {content.action}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

