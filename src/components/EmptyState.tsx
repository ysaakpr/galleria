import { Image as ImageIcon, Upload, Sparkles, Folder, Users, Plus } from 'lucide-react'
import { Button } from './ui/button'

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
          title: 'Your gallery awaits',
          subtitle: 'No photos yet',
          description: 'Start building your beautiful photo collection. Upload memories, moments, and masterpieces.',
          action: 'Upload Your First Photos',
          gradient: 'from-blue-500 to-cyan-500',
          features: [
            { icon: Sparkles, text: 'Auto-optimized for web & mobile' },
            { icon: Upload, text: 'Drag & drop support' },
            { icon: ImageIcon, text: 'Multiple format support' },
          ]
        }
      case 'albums':
        return {
          icon: Folder,
          title: 'Organize your memories',
          subtitle: 'No albums yet',
          description: 'Create beautiful albums to organize your photos by events, trips, or themes.',
          action: 'Create Your First Album',
          gradient: 'from-purple-500 to-pink-500',
          features: [
            { icon: Folder, text: 'Custom album covers' },
            { icon: Plus, text: 'Unlimited albums' },
            { icon: ImageIcon, text: 'Easy photo management' },
          ]
        }
      case 'people':
        return {
          icon: Users,
          title: 'Find faces you love',
          subtitle: 'No people detected',
          description: 'Upload photos with people and we\'ll help you organize them by faces automatically.',
          action: 'Upload Photos',
          gradient: 'from-green-500 to-emerald-500',
          features: [
            { icon: Users, text: 'Automatic face detection' },
            { icon: Sparkles, text: 'Smart grouping' },
            { icon: ImageIcon, text: 'Easy tagging' },
          ]
        }
      default:
        return {
          icon: ImageIcon,
          title: 'Nothing here',
          subtitle: 'Empty space',
          description: 'Start by uploading some photos',
          action: 'Upload',
          gradient: 'from-primary-500 to-blue-500',
          features: []
        }
    }
  }

  const content = getContent()
  const Icon = content.icon

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-4xl w-full">
        {/* Main Content */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Large Icon */}
          <div className="relative inline-block mb-8">
            <div className={`w-32 h-32 mx-auto bg-gradient-to-br ${content.gradient} rounded-3xl flex items-center justify-center shadow-2xl animate-scale-in`}>
              <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />
            </div>
            {/* Decorative elements */}
            <div className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br ${content.gradient} rounded-full opacity-20 animate-pulse`}></div>
            <div className={`absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br ${content.gradient} rounded-full opacity-10 animate-pulse delay-300`}></div>
          </div>

          {/* Text */}
          <div className="space-y-3 mb-10">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {content.subtitle}
            </p>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {content.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {content.description}
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onUpload}
            size="lg"
            className={`bg-gradient-to-r ${content.gradient} hover:opacity-90 text-white text-lg px-10 py-7 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105`}
          >
            <Upload className="w-6 h-6 mr-3" />
            {content.action}
          </Button>
        </div>

        {/* Features Grid */}
        {content.features.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-slide-up">
            {content.features.map((feature, index) => {
              const FeatureIcon = feature.icon
              return (
                <div
                  key={index}
                  className="glass-card p-6 rounded-2xl hover:scale-105 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 mb-4 bg-gradient-to-br ${content.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <FeatureIcon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {feature.text}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Subtle hint */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            💡 <span className="font-medium">Pro tip:</span> You can also drag and drop files directly
          </p>
        </div>
      </div>
    </div>
  )
}

