'use client'

import { useArtistContext } from '@/contexts/ArtistContext'
import { Building2, User, Info } from 'lucide-react'

interface AnalyticsPageHeaderProps {
  showMockDataNotice?: boolean
}

export default function AnalyticsPageHeader({ showMockDataNotice = true }: AnalyticsPageHeaderProps) {
  const { selectedArtist, isAllArtists } = useArtistContext()

  return (
    <div className="mb-6 space-y-4">
      {/* Current View Indicator */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
          {isAllArtists ? (
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">Currently viewing</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {isAllArtists ? 'All Artists (Portfolio View)' : selectedArtist?.name}
          </p>
        </div>
        {!isAllArtists && selectedArtist?.image_url && (
          <img
            src={selectedArtist.image_url}
            alt={selectedArtist.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
      </div>

      {/* Mock Data Notice */}
      {showMockDataNotice && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
              Development Mode - Mock Data
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Currently displaying sample data. When connected to the backend API,
              {isAllArtists
                ? ' data will be aggregated from all your artists.'
                : ` data will be filtered specifically for ${selectedArtist?.name}.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
