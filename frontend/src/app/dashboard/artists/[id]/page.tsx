'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Alert from '@/components/ui/Alert'
import { artistDetailApi, ArtistStats, MomentumDataPoint, TopTrack } from '@/lib/api/artistDetail'
import { actionsApi, NextAction } from '@/lib/api/actions'
import { superfansApi, Superfan } from '@/lib/api/superfans'
import {
  ArrowLeft, Music, TrendingUp, TrendingDown, Heart, Zap,
  AlertCircle, Users, Activity, ArrowUp, ArrowDown, Minus,
  Play, CheckCircle, Clock, XCircle
} from 'lucide-react'
import Link from 'next/link'
import { MomentumChart } from '@/components/charts/MomentumChart'
import { AudioPlayer } from '@/components/player/AudioPlayer'
import { SocialMediaConnections } from '@/components/artist/SocialMediaConnections'

export default function ArtistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const artistId = params.id as string

  const [stats, setStats] = useState<ArtistStats | null>(null)
  const [momentumHistory, setMomentumHistory] = useState<MomentumDataPoint[]>([])
  const [actions, setActions] = useState<NextAction[]>([])
  const [superfans, setSuperfans] = useState<Superfan[]>([])
  const [topTracks, setTopTracks] = useState<TopTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (artistId) {
      fetchArtistData()
    }
  }, [artistId])

  const fetchArtistData = async () => {
    try {
      setLoading(true)
      const [statsData, historyData, actionsData, superfansData, tracksData] = await Promise.all([
        artistDetailApi.getStats(artistId),
        artistDetailApi.getMomentumHistory(artistId, 90),
        actionsApi.getForArtist(artistId).catch(() => []),
        superfansApi.getForArtist(artistId).catch(() => []),
        artistDetailApi.getTopTracks(artistId, 10).catch(() => [])
      ])

      setStats(statsData)
      setMomentumHistory(historyData)
      setActions(actionsData)
      setSuperfans(superfansData)
      setTopTracks(tracksData)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch artist data:', err)
      setError('Failed to load artist data')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getMomentumColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'fire': return 'text-red-600'
      case 'rising':
      case 'growing': return 'text-green-600'
      case 'steady': return 'text-blue-600'
      case 'declining':
      case 'falling': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getMomentumBgColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'fire': return 'bg-red-50 border-red-200'
      case 'rising':
      case 'growing': return 'bg-green-50 border-green-200'
      case 'steady': return 'bg-blue-50 border-blue-200'
      case 'declining':
      case 'falling': return 'bg-orange-50 border-orange-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getTrendIcon = (trend: number | null) => {
    if (!trend) return <Minus className="w-4 h-4 text-gray-400" />
    if (trend > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
    if (trend < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getTrendColor = (trend: number | null) => {
    if (!trend) return 'text-gray-600'
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800' }
      case 'high':
        return { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' }
      case 'medium':
        return { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' }
      default:
        return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending': return <Clock className="w-4 h-4 text-blue-600" />
      case 'snoozed': return <Clock className="w-4 h-4 text-gray-600" />
      case 'ignored': return <XCircle className="w-4 h-4 text-gray-600" />
      default: return null
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="space-y-6">
              {/* Loading skeleton */}
              <div className="bg-white rounded-xl shadow-sm p-8 animate-pulse">
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-8 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : stats ? (
            <>
              {/* Artist Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-start gap-6">
                  {/* Artist Image */}
                  {stats.artist_image ? (
                    <img
                      src={stats.artist_image}
                      alt={stats.artist_name}
                      className="w-32 h-32 rounded-xl object-cover shadow-xl border-4 border-white/20"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-xl border-4 border-white/20">
                      <Music className="w-16 h-16 text-white/60" />
                    </div>
                  )}

                  {/* Artist Info */}
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2">{stats.artist_name}</h1>
                    {stats.artist_genre && (
                      <p className="text-blue-100 mb-3">{stats.artist_genre}</p>
                    )}

                    {/* Social Media Connections */}
                    <div className="mb-4">
                      <SocialMediaConnections
                        spotifyId={stats.spotify_id ?? undefined}
                        instagramId={stats.instagram_id ?? undefined}
                        youtubeId={stats.youtube_id ?? undefined}
                        appleMusicId={stats.apple_music_id ?? undefined}
                        tiktokId={stats.tiktok_id ?? undefined}
                        twitterId={stats.twitter_id ?? undefined}
                        facebookId={stats.facebook_id ?? undefined}
                      />
                    </div>

                    {/* Momentum Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                      <Activity className="w-5 h-5" />
                      <span className="font-semibold">
                        {stats.momentum_status.charAt(0).toUpperCase() + stats.momentum_status.slice(1)} Momentum
                      </span>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                        {stats.current_momentum.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Momentum Card */}
                <div className={`rounded-xl border-2 p-6 ${getMomentumBgColor(stats.momentum_status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <TrendingUp className={`w-6 h-6 ${getMomentumColor(stats.momentum_status)}`} />
                    </div>
                    {getTrendIcon(stats.momentum_trend_7d)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Momentum Index</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.current_momentum.toFixed(1)}/10</p>
                    {stats.momentum_trend_7d !== null && (
                      <p className={`text-sm mt-2 ${getTrendColor(stats.momentum_trend_7d)}`}>
                        {stats.momentum_trend_7d > 0 ? '+' : ''}{stats.momentum_trend_7d.toFixed(1)}% (7d)
                      </p>
                    )}
                  </div>
                </div>

                {/* Superfans Card */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border-2 border-pink-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-pink-600 rounded-lg shadow-sm">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-pink-900 mb-1">Total Superfans</h3>
                    <p className="text-3xl font-bold text-pink-900">{formatNumber(stats.total_superfans)}</p>
                    <p className="text-xs text-pink-700 mt-2">High-value fans</p>
                  </div>
                </div>

                {/* Streams Card */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-600 rounded-lg shadow-sm">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-purple-900 mb-1">Total Streams</h3>
                    <p className="text-3xl font-bold text-purple-900">{formatNumber(stats.total_streams)}</p>
                    <p className="text-xs text-purple-700 mt-2">All platforms</p>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-600 rounded-lg shadow-sm">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    {stats.critical_actions > 0 && (
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Pending Actions</h3>
                    <p className="text-3xl font-bold text-blue-900">{stats.pending_actions}</p>
                    {stats.critical_actions > 0 && (
                      <p className="text-xs text-red-600 font-semibold mt-2">
                        {stats.critical_actions} Critical
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Actions List - 2 columns */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Next Best Actions</h2>
                      <p className="text-sm text-gray-600">AI-recommended actions for growth</p>
                    </div>
                    <Link
                      href="/dashboard/actions"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View All →
                    </Link>
                  </div>

                  {actions.length === 0 ? (
                    <div className="text-center py-12">
                      <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No pending actions</p>
                      <p className="text-sm text-gray-500">All caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {actions.slice(0, 5).map((action) => {
                        const config = getUrgencyConfig(action.urgency)
                        return (
                          <div
                            key={action.id}
                            className={`p-4 rounded-lg border-l-4 ${config.bg} ${config.border}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${config.badge}`}>
                                    {action.urgency}
                                  </span>
                                  {getStatusIcon(action.status)}
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{action.description}</p>
                                {action.reason && (
                                  <p className="text-xs text-gray-600">
                                    <strong>Why:</strong> {action.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Superfans List - 1 column */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Top Superfans</h2>
                    <p className="text-sm text-gray-600">Highest FVS scores</p>
                  </div>

                  {superfans.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No superfans data yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {superfans.slice(0, 10).map((fan, index) => (
                        <div
                          key={fan.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Fan #{fan.platform_user_id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {fan.listening_hours}h listening
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-pink-600">
                              {fan.fvs_score}
                            </div>
                            <div className="text-xs text-gray-500">FVS</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {superfans.length > 10 && (
                    <Link
                      href="/dashboard/superfans"
                      className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View All Superfans →
                    </Link>
                  )}
                </div>
              </div>

              {/* Momentum Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Momentum Trend</h2>
                    <p className="text-sm text-gray-600">
                      {momentumHistory.length > 0
                        ? `${momentumHistory.length} days of momentum data`
                        : 'No momentum data available yet'}
                    </p>
                  </div>
                  {momentumHistory.length > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Current Score</p>
                      <p className={`text-2xl font-bold ${getMomentumColor(stats?.momentum_status || 'stable')}`}>
                        {stats?.current_momentum.toFixed(1)}/10
                      </p>
                    </div>
                  )}
                </div>
                <MomentumChart data={momentumHistory} height={350} />
              </div>

              {/* Top Tracks */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Top Tracks</h2>
                    <p className="text-sm text-gray-600">Most streamed tracks from portfolio</p>
                  </div>
                </div>

                {topTracks.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No track data available</p>
                    <p className="text-sm text-gray-500">Track data will appear as it's collected</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topTracks.map((track, index) => (
                      <div
                        key={track.id}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center gap-4 p-4 bg-white">
                          {/* Rank */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>

                          {/* Track Image */}
                          {track.image_url ? (
                            <img
                              src={track.image_url}
                              alt={track.name}
                              className="w-12 h-12 rounded-lg object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Music className="w-6 h-6 text-gray-400" />
                            </div>
                          )}

                          {/* Track Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{track.name}</h3>
                            <p className="text-sm text-gray-600">
                              {formatNumber(track.streams)} streams
                            </p>
                          </div>

                          {/* Spotify Link */}
                          {track.spotify_url && (
                            <a
                              href={track.spotify_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              title="Open in Spotify"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                              </svg>
                            </a>
                          )}
                        </div>

                        {/* Audio Player */}
                        {track.preview_url && (
                          <div className="px-4 pb-4">
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
            </>
          ) : (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Artist not found</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
