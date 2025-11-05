'use client'

/**
 * TopTracksTable - Top 10 tracks tous artistes confondus
 * Affiche les tracks les plus streamés avec trend et artist
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Music, Play, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'

interface Track {
  id: string
  name: string
  artist_id: string
  artist_name: string
  image_url: string | null
  streams: number
  trend_7d: number | null
  spotify_url: string | null
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
          const tracksResponse = await api.get(`/api/analytics/artists/${artist.id}/top-tracks`, {
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

      {/* Tracks Table */}
      {tracks.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No track data available yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Track
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Artist
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Streams
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trend (7d)
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {tracks.map((track, index) => (
                <tr
                  key={track.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Rank */}
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </td>

                  {/* Track Info */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {track.image_url ? (
                        <img
                          src={track.image_url}
                          alt={track.name}
                          className="w-12 h-12 rounded-lg object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Music className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {track.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Artist */}
                  <td className="py-4 px-4">
                    <Link
                      href={`/dashboard/artists/${track.artist_id}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {track.artist_name}
                    </Link>
                  </td>

                  {/* Streams */}
                  <td className="py-4 px-4 text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatNumber(track.streams)}
                    </div>
                  </td>

                  {/* Trend */}
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
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
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    {track.spotify_url && (
                      <a
                        href={track.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Open in Spotify"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
