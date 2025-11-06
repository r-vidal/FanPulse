'use client'

import React, { useState } from 'react'
import { Music, ExternalLink, Play } from 'lucide-react'

interface SpotifyPlayerWidgetProps {
  playlistId?: string
  artistId?: string
  albumId?: string
  trackId?: string
  title?: string
  compact?: boolean
}

export const SpotifyPlayerWidget: React.FC<SpotifyPlayerWidgetProps> = ({
  playlistId,
  artistId,
  albumId,
  trackId,
  title = 'Now Playing',
  compact = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  // Build Spotify embed URL
  const getEmbedUrl = () => {
    if (playlistId) {
      return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`
    }
    if (artistId) {
      return `https://open.spotify.com/embed/artist/${artistId}?utm_source=generator&theme=0`
    }
    if (albumId) {
      return `https://open.spotify.com/embed/album/${albumId}?utm_source=generator&theme=0`
    }
    if (trackId) {
      return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`
    }
    return null
  }

  const getExternalUrl = () => {
    if (playlistId) return `https://open.spotify.com/playlist/${playlistId}`
    if (artistId) return `https://open.spotify.com/artist/${artistId}`
    if (albumId) return `https://open.spotify.com/album/${albumId}`
    if (trackId) return `https://open.spotify.com/track/${trackId}`
    return null
  }

  const embedUrl = getEmbedUrl()
  const externalUrl = getExternalUrl()

  if (!embedUrl) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 p-8 text-center">
        <div className="p-4 bg-green-500 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Music className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-700 font-medium">No Spotify content configured</p>
        <p className="text-sm text-gray-600 mt-2">Add a Spotify playlist, artist, album, or track ID</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <iframe
          src={embedUrl}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {!isLoaded && (
          <div className="h-[152px] flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="group bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{title}</h3>
            <p className="text-green-100 text-xs">Spotify Player</p>
          </div>
        </div>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            title="Open in Spotify"
          >
            <ExternalLink className="w-5 h-5 text-white" />
          </a>
        )}
      </div>

      {/* Player */}
      <div className="relative bg-gradient-to-br from-gray-50 to-white">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
            <div className="text-center">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-bounce" />
              <p className="text-gray-600 text-sm font-medium">Loading Spotify Player...</p>
            </div>
          </div>
        )}
        <iframe
          src={embedUrl}
          width="100%"
          height="352"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    </div>
  )
}
