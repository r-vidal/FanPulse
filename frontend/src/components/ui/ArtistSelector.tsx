'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useArtistContext } from '@/contexts/ArtistContext'
import { ChevronDown, Users, Plus, Settings, Check, Loader2, Building2 } from 'lucide-react'

export default function ArtistSelector() {
  const router = useRouter()
  const { selectedArtist, artists, loading, setSelectedArtist, isAllArtists } = useArtistContext()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectArtist = (artist: any) => {
    setSelectedArtist(artist)
    setIsOpen(false)
  }

  const handleAddArtist = () => {
    setIsOpen(false)
    router.push('/dashboard/artists/add')
  }

  const handleManageArtists = () => {
    setIsOpen(false)
    router.push('/dashboard/artists')
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading artists...</span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors min-w-[200px] group"
      >
        {/* Icon */}
        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md">
          {isAllArtists ? (
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 text-left">
          <p className="text-xs text-gray-500 dark:text-gray-500">Viewing</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {isAllArtists ? 'All Artists (Portfolio)' : selectedArtist?.name || 'Select Artist'}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden min-w-[280px]">
          {/* All Artists Option */}
          <button
            onClick={() => handleSelectArtist(null)}
            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
              isAllArtists ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isAllArtists ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Building2 className={`w-5 h-5 ${isAllArtists ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-semibold ${isAllArtists ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  All Artists
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Portfolio view</p>
              </div>
            </div>
            {isAllArtists && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

          {/* Individual Artists */}
          {artists.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No artists yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Add your first artist to get started</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {artists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleSelectArtist(artist)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                    selectedArtist?.id === artist.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Artist Image or Initials */}
                    {artist.image_url ? (
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        selectedArtist?.id === artist.id
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {artist.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${
                        selectedArtist?.id === artist.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {artist.name}
                      </p>
                      {artist.spotify_id && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">Spotify Connected</p>
                      )}
                    </div>
                  </div>
                  {selectedArtist?.id === artist.id && (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={handleAddArtist}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg transition-colors text-left"
            >
              <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded">
                <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Add New Artist</span>
            </button>

            <button
              onClick={handleManageArtists}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg transition-colors text-left"
            >
              <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Artists</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
