'use client'

/**
 * TopTracksTable - Top 10 tracks tous artistes confondus
 * Affiche les tracks les plus streamés avec trend et artist
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Music, Play, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { AudioPlayer } from '@/components/player/AudioPlayer'

interface Track {
  id: string
  name: string
  artist_id: string
  artist_name: string
  image_url: string | null
  streams: number
  trend_7d: number | null
  spotify_url: string | null
  preview_url?: string | null
}

export function TopTracksTable() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopTracks()
  }, [])

  const loadTopTracks = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API endpoint when available
      // For now, fetch from all artists
      const artistsResponse = await api.get('/api/artists/')
      const allTracks: Track[] = []

      // Fetch top tracks for each artist
      for (const artist of artistsResponse.data) {
        try {
          const tracksResponse = await api.get(`/api/artist-detail/${artist.id}/top-tracks`, {
            params: { limit: 5 }
          })
          const artistTracks = tracksResponse.data.map((track: any) => ({
            ...track,
            artist_id: artist.id,
            artist_name: artist.name
          }))
          allTracks.push(...artistTracks)
        } catch (error) {
          console.error(`Failed to load tracks for ${artist.name}:`, error)
        }
      }

      // Sort by streams and take top 10
      const topTracks = allTracks
        .sort((a, b) => b.streams - a.streams)
        .slice(0, 10)

      setTracks(topTracks)
    } catch (error) {
      console.error('Failed to load top tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTrendIcon = (trend: number | null) => {
    if (!trend) return <Minus className="w-4 h-4 text-gray-400" />
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getTrendColor = (trend: number | null) => {
    if (!trend) return 'text-gray-600 dark:text-gray-400'
    if (trend > 0) return 'text-green-600 dark:text-green-400'
    if (trend < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Tracks</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Most streamed across your portfolio</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Play className="w-4 h-4" />
          <span>{formatNumber(tracks.reduce((sum, t) => sum + t.streams, 0))} total streams</span>
        </div>
      </div>

      {/* Tracks Grid */}
      {tracks.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No track data available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="group border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
            >
              <div className="flex items-center gap-4 p-4">
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {index + 1}
                </div>

                {/* Track Image */}
                {track.image_url ? (
                  <img
                    src={track.image_url}
                    alt={track.name}
                    className="w-14 h-14 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <Music className="w-7 h-7 text-gray-400" />
                  </div>
                )}

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate text-base">
                    {track.name}
                  </h4>
                  <Link
                    href={`/dashboard/artists/${track.artist_id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {track.artist_name}
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  {/* Streams */}
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Streams</div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatNumber(track.streams)}
                    </div>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center gap-1">
                    {getTrendIcon(track.trend_7d)}
                    <span className={`text-sm font-medium ${getTrendColor(track.trend_7d)}`}>
                      {track.trend_7d !== null ? (
                        <>
                          {track.trend_7d > 0 ? '+' : ''}
                          {track.trend_7d.toFixed(1)}%
                        </>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>

                  {/* Spotify Link */}
                  {track.spotify_url && (
                    <a
                      href={track.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                      title="Open in Spotify"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              {/* Audio Player */}
              {track.preview_url && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 bg-white dark:bg-gray-900">
                  <AudioPlayer
                    previewUrl={track.preview_url}
                    trackName={track.name}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
