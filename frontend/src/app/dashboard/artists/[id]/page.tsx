'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ArrowLeft, Music, ExternalLink, TrendingUp, Users, Calendar } from 'lucide-react'
import Alert from '@/components/ui/Alert'

interface Artist {
  id: string
  name: string
  genre: string | null
  spotify_id: string | null
  instagram_id: string | null
  youtube_id: string | null
  image_url: string | null
  created_at: string
}

interface ArtistStats {
  followers: number
  popularity: number
  monthly_listeners: number
  top_tracks: Array<{
    id: string
    name: string
    popularity: number
  }>
}

interface Momentum {
  score: number
  status: string
  signals: {
    popularity: number
    follower_growth: number
    top_tracks: number
  }
  trend_7d: number | null
  trend_30d: number | null
  data_points: {
    '7d': number
    '30d': number
  }
}

interface InstagramStats {
  platform: string
  username: string
  followers: number
  impressions: number
  reach: number
  profile_views: number
  recent_posts: number
  avg_engagement_per_post: number
  engagement_rate: number
  recent_media: Array<{
    id: string
    caption: string
    media_type: string
    media_url: string
    thumbnail_url?: string
    permalink: string
    timestamp: string
    likes: number
    comments: number
  }>
  timestamp: string
  account_type: string
}

export default function ArtistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [stats, setStats] = useState<ArtistStats | null>(null)
  const [instagramStats, setInstagramStats] = useState<InstagramStats | null>(null)
  const [momentum, setMomentum] = useState<Momentum | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [instagramLoading, setInstagramLoading] = useState(false)
  const [momentumLoading, setMomentumLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchArtist(params.id as string)
    }
  }, [params.id])

  const fetchArtist = async (artistId: string) => {
    try {
      setLoading(true)
      const response = await api.get(`/api/artists/${artistId}`)
      setArtist(response.data)
      setError(null)

      // If artist has Spotify ID, fetch stats and momentum
      if (response.data.spotify_id) {
        fetchStats(artistId)
        fetchMomentum(artistId)
      }

      // If artist has Instagram connection, fetch Instagram stats
      if (response.data.instagram_id) {
        fetchInstagramStats(artistId)
      }
    } catch (err: any) {
      console.error('Failed to fetch artist:', err)
      setError('Failed to load artist details')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (artistId: string) => {
    try {
      setStatsLoading(true)
      const response = await api.get(`/api/artists/${artistId}/stats`)
      setStats(response.data)
    } catch (err: any) {
      console.error('Failed to fetch stats:', err)
      // Don't show error for stats, just keep them empty
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchInstagramStats = async (artistId: string) => {
    try {
      setInstagramLoading(true)
      const response = await api.get(`/api/artists/${artistId}/instagram-stats`)
      setInstagramStats(response.data)
    } catch (err: any) {
      console.error('Failed to fetch Instagram stats:', err)
      // Don't show error for Instagram stats, just keep them empty
    } finally {
      setInstagramLoading(false)
    }
  }

  const fetchMomentum = async (artistId: string) => {
    try {
      setMomentumLoading(true)
      const response = await api.get(`/api/momentum/${artistId}`)
      setMomentum(response.data)
    } catch (err: any) {
      console.error('Failed to fetch momentum:', err)
      // Don't show error for momentum, just keep it empty
    } finally {
      setMomentumLoading(false)
    }
  }

  const handleConnectSpotify = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/authorize`
  }

  const captureSnapshot = async () => {
    if (!artist) return

    try {
      await api.post(`/api/stream-history/capture/${artist.id}`)
      alert('✅ Snapshot captured successfully! Historical data saved.')
    } catch (err: any) {
      console.error('Failed to capture snapshot:', err)
      alert('Failed to capture snapshot. Please try again.')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !artist) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <Alert type="error" title="Error">
              {error || 'Artist not found'}
            </Alert>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          {/* Artist Header */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Artist Image */}
              <div className="flex-shrink-0">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-48 h-48 rounded-lg object-cover shadow-md"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Music className="w-24 h-24 text-white" />
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{artist.name}</h1>
                {artist.genre && (
                  <p className="text-lg text-gray-600 mb-4 capitalize">{artist.genre}</p>
                )}

                {/* Platform Connections */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {artist.spotify_id && (
                    <a
                      href={`https://open.spotify.com/artist/${artist.spotify_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Spotify
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  )}
                  {artist.instagram_id && (
                    <a
                      href={`https://instagram.com/${artist.instagram_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      Instagram
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  )}
                  {artist.youtube_id && (
                    <a
                      href={`https://youtube.com/channel/${artist.youtube_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      YouTube
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  )}

                  {/* Connect Buttons for disconnected platforms */}
                  {!artist.instagram_id && (
                    <button
                      onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/instagram/authorize?artist_id=${artist.id}`}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Connect Instagram
                    </button>
                  )}
                </div>

                {/* Added Date */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  Added on {new Date(artist.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>

                {/* Capture Snapshot Button */}
                {artist.spotify_id && (
                  <button
                    onClick={captureSnapshot}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Capture Data Snapshot
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Momentum Index */}
          {artist.spotify_id && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg p-8 border border-purple-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-7 h-7 mr-3 text-purple-600" />
                Momentum Index
              </h2>

              {momentumLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
                </div>
              ) : momentum ? (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Gauge & Score */}
                  <div className="flex flex-col items-center justify-center">
                    {/* Circular Gauge */}
                    <div className="relative w-48 h-48 mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background circle */}
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="16"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke={
                            momentum.status === 'fire' ? '#ef4444' :
                            momentum.status === 'growing' ? '#10b981' :
                            momentum.status === 'stable' ? '#f59e0b' :
                            '#6b7280'
                          }
                          strokeWidth="16"
                          strokeDasharray={`${(momentum.score / 10) * 502.4} 502.4`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      {/* Score in center */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-gray-900">
                          {momentum.score.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500 mt-1">/ 10</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-6 py-3 rounded-full text-lg font-bold ${
                      momentum.status === 'fire' ? 'bg-red-100 text-red-700' :
                      momentum.status === 'growing' ? 'bg-green-100 text-green-700' :
                      momentum.status === 'stable' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {momentum.status === 'fire' && '🔥 Fire'}
                      {momentum.status === 'growing' && '📈 Growing'}
                      {momentum.status === 'stable' && '➡️ Stable'}
                      {momentum.status === 'declining' && '📉 Declining'}
                    </div>

                    {/* Trends */}
                    {(momentum.trend_7d !== null || momentum.trend_30d !== null) && (
                      <div className="mt-6 space-y-2 w-full">
                        {momentum.trend_7d !== null && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">7-day trend:</span>
                            <span className={`font-semibold ${momentum.trend_7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {momentum.trend_7d >= 0 ? '+' : ''}{momentum.trend_7d.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {momentum.trend_30d !== null && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">30-day trend:</span>
                            <span className={`font-semibold ${momentum.trend_30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {momentum.trend_30d >= 0 ? '+' : ''}{momentum.trend_30d.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Signals Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Signal Breakdown</h3>
                    <div className="space-y-4">
                      {/* Popularity */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Popularity</span>
                          <span className="text-sm font-bold text-purple-600">{momentum.signals.popularity.toFixed(1)}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(momentum.signals.popularity / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Follower Growth */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Follower Growth</span>
                          <span className="text-sm font-bold text-blue-600">{momentum.signals.follower_growth.toFixed(1)}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(momentum.signals.follower_growth / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Top Tracks */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Top Tracks Performance</span>
                          <span className="text-sm font-bold text-green-600">{momentum.signals.top_tracks.toFixed(1)}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(momentum.signals.top_tracks / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Data Points Info */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-800">
                        <strong>ℹ️ Calculation:</strong> Based on {momentum.data_points['30d']} historical data points.
                        {momentum.data_points['30d'] < 7 && ' Capture more snapshots for better accuracy!'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No momentum data available yet.</p>
                  <p className="text-sm text-gray-500">Capture a data snapshot to start tracking momentum!</p>
                </div>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Followers</h3>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-9 bg-gray-200 rounded w-24 mb-2"></div>
                </div>
              ) : stats ? (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.followers.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Spotify followers</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900">-</p>
                  <p className="text-sm text-gray-600 mt-2">Data unavailable</p>
                </>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Monthly Listeners</h3>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-9 bg-gray-200 rounded w-24 mb-2"></div>
                </div>
              ) : stats ? (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.monthly_listeners.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Estimated listeners</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900">-</p>
                  <p className="text-sm text-gray-600 mt-2">Data unavailable</p>
                </>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Popularity</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-9 bg-gray-200 rounded w-24 mb-2"></div>
                </div>
              ) : stats ? (
                <>
                  <p className="text-3xl font-bold text-gray-900">{stats.popularity}/100</p>
                  <p className="text-sm text-gray-600 mt-2">Spotify popularity score</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900">-</p>
                  <p className="text-sm text-gray-600 mt-2">Data unavailable</p>
                </>
              )}
            </div>
          </div>

          {/* Streaming Data Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Streaming Analytics</h2>

            {stats && stats.top_tracks && stats.top_tracks.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Top Tracks</h3>
                <div className="space-y-2">
                  {stats.top_tracks.slice(0, 5).map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-400 w-6">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{track.name}</p>
                          <p className="text-sm text-gray-600">
                            Popularity: {track.popularity}/100
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> These are estimated metrics based on public Spotify data.
                    For detailed streaming analytics, Spotify for Artists API access is required.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Analytics Data Available
                  </h3>
                  <p className="text-blue-700 mb-4">
                    {artist?.spotify_id
                      ? 'Viewing public Spotify metrics. For detailed analytics, connect your Spotify for Artists account.'
                      : 'Connect this artist to Spotify to view streaming analytics.'}
                  </p>
                </div>
                <button
                  onClick={handleConnectSpotify}
                  className="px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Connect Spotify for Enhanced Analytics
                </button>
                <p className="text-xs text-gray-600 mt-3">
                  Optional: Get access to detailed streaming statistics and historical data
                </p>
              </div>
            )}
          </div>

          {/* Instagram Analytics Section */}
          {artist?.instagram_id && (
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg shadow-lg p-6 border border-pink-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram Analytics
              </h2>

              {instagramLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600"></div>
                </div>
              ) : instagramStats ? (
                <div className="space-y-6">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Followers</p>
                      <p className="text-2xl font-bold text-gray-900">{instagramStats.followers.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Engagement Rate</p>
                      <p className="text-2xl font-bold text-pink-600">{instagramStats.engagement_rate.toFixed(2)}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Profile Views</p>
                      <p className="text-2xl font-bold text-gray-900">{instagramStats.profile_views.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Reach (30d)</p>
                      <p className="text-2xl font-bold text-gray-900">{instagramStats.reach.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Impressions (30d)</p>
                      <p className="text-xl font-bold text-gray-900">{instagramStats.impressions.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm font-medium text-gray-500 mb-1">Avg Engagement/Post</p>
                      <p className="text-xl font-bold text-gray-900">{instagramStats.avg_engagement_per_post.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Recent Posts */}
                  {instagramStats.recent_media && instagramStats.recent_media.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Posts</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {instagramStats.recent_media.map((media) => (
                          <a
                            key={media.id}
                            href={media.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={media.thumbnail_url || media.media_url}
                              alt={media.caption?.slice(0, 50) || 'Instagram post'}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="text-white text-center px-2">
                                <p className="flex items-center justify-center gap-2 mb-2">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                  </svg>
                                  <span>{media.likes.toLocaleString()}</span>
                                </p>
                                <p className="flex items-center justify-center gap-2">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                                  </svg>
                                  <span>{media.comments.toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account Info Note */}
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Account Type:</strong> {instagramStats.account_type === 'business' ? 'Business/Creator Account' : 'Personal Account'}
                      {instagramStats.account_type !== 'business' && ' • Switch to a Business account for detailed insights and analytics.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Failed to load Instagram stats</p>
                  <p className="text-sm text-gray-500">The Instagram connection may need to be refreshed.</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Activity Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-center py-8 text-gray-500">
              <Music className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No activity data available yet</p>
              <p className="text-sm mt-1">Connect platforms to start tracking activity</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
