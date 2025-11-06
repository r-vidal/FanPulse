'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import Alert from '@/components/ui/Alert'
import { SkeletonStats, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton'
import { dashboardApi, DashboardStats, TopArtist, RecentActivity } from '@/lib/api/dashboard'
import {
  Music, TrendingUp, Heart, Zap, AlertCircle, Users,
  Activity, CheckCircle, ArrowRight, ArrowUp, ArrowDown,
  BarChart3, Target, Clock, Play
} from 'lucide-react'
import Link from 'next/link'
import {
  PortfolioSnapshot,
  TopTracksTable,
  ArtistRankings,
  BestTimeToPostV2,
  StreamEvolutionV2,
  SocialEngagementV2
} from '@/components/dashboard'
import { SpotifyPlayerWidget } from '@/components/player/SpotifyPlayerWidget'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topPerformers, setTopPerformers] = useState<TopArtist[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [artists, setArtists] = useState<any[]>([])
  const [selectedArtistId, setSelectedArtistId] = useState<string>('all')

  useEffect(() => {
    fetchArtists()
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [selectedArtistId])

  const fetchArtists = async () => {
    try {
      const { api } = await import('@/lib/api')
      const response = await api.get('/api/artists/')
      setArtists(response.data)
    } catch (err: any) {
      console.error('Failed to fetch artists:', err)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, topPerformersData, activityData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTopPerformers(5),
        dashboardApi.getRecentActivity(8)
      ])
      setStats(statsData)
      setTopPerformers(topPerformersData)
      setRecentActivity(activityData)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data')
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
    switch (status) {
      case 'fire': return 'text-red-600'
      case 'growing': return 'text-green-600'
      case 'stable': return 'text-blue-600'
      case 'declining': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getMomentumBgColor = (status: string) => {
    switch (status) {
      case 'fire': return 'bg-red-50 border-red-200'
      case 'growing': return 'bg-green-50 border-green-200'
      case 'stable': return 'bg-blue-50 border-blue-200'
      case 'declining': return 'bg-orange-50 border-orange-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getActivityIcon = (type: string, severity?: string) => {
    if (type === 'alert') {
      if (severity === 'urgent') return <AlertCircle className="w-5 h-5 text-red-600" />
      return <AlertCircle className="w-5 h-5 text-orange-600" />
    }
    if (type === 'action') return <Zap className="w-5 h-5 text-blue-600" />
    return <Activity className="w-5 h-5 text-purple-600" />
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                <p className="text-blue-100 text-lg">
                  Welcome back! Here's your portfolio overview.
                </p>
              </div>
              {/* Artist Filter */}
              {artists.length > 0 && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3">
                  <label htmlFor="artist-filter" className="text-sm font-medium text-white">
                    View:
                  </label>
                  <select
                    id="artist-filter"
                    value={selectedArtistId}
                    onChange={(e) => setSelectedArtistId(e.target.value)}
                    className="px-4 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white bg-white/20 backdrop-blur-sm text-white font-medium"
                  >
                    <option value="all" className="text-gray-900">All Artists</option>
                    {artists.map((artist) => (
                      <option key={artist.id} value={artist.id} className="text-gray-900">
                        {artist.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Email Verification Notice */}
          {user && !user.is_verified && (
            <Alert type="warning" title="Email Not Verified">
              Please check your email to verify your account. Check your spam folder if you don't see it.
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {loading ? (
            <>
              <SkeletonStats />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SkeletonList items={5} />
                </div>
                <SkeletonCard />
              </div>
            </>
          ) : stats ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Artists */}
                <div className="group relative bg-white rounded-2xl border-2 border-blue-100 p-6 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-700">Growing</p>
                        <p className="text-xs text-blue-600">+{stats.artists_growing}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Artists</h3>
                      <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{stats.total_artists}</p>
                      {stats.artists_declining > 0 && (
                        <p className="text-xs text-orange-600 mt-2 font-medium">
                          {stats.artists_declining} declining
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Streams */}
                <div className="group relative bg-white rounded-2xl border-2 border-purple-100 p-6 hover:shadow-2xl hover:border-purple-300 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Streams</h3>
                      <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{formatNumber(stats.total_streams)}</p>
                      <p className="text-xs text-purple-600 mt-2 font-medium">Across all platforms</p>
                    </div>
                  </div>
                </div>

                {/* Avg Momentum */}
                <div className="group relative bg-white rounded-2xl border-2 border-green-100 p-6 hover:shadow-2xl hover:border-green-300 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 font-semibold uppercase">Score</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Avg Momentum</h3>
                      <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{stats.avg_momentum.toFixed(1)}/10</p>
                      <p className="text-xs text-green-600 mt-2 font-medium">Portfolio average</p>
                    </div>
                  </div>
                </div>

                {/* Total Superfans */}
                <div className="group relative bg-white rounded-2xl border-2 border-pink-100 p-6 hover:shadow-2xl hover:border-pink-300 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Heart className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Superfans</h3>
                      <p className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent">{formatNumber(stats.total_superfans)}</p>
                      <p className="text-xs text-pink-600 mt-2 font-medium">High-value fans</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions & Alerts Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Actions */}
                <div className="group relative bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Actions</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{stats.pending_actions}</p>
                      </div>
                    </div>
                    {stats.critical_actions > 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-xs font-semibold text-red-700">
                          🔥 {stats.critical_actions} Critical Priority
                        </p>
                      </div>
                    )}
                    <Link
                      href="/dashboard/actions"
                      className="mt-4 block text-center text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                    >
                      View All Actions →
                    </Link>
                  </div>
                </div>

                {/* Recent Alerts */}
                <div className="group relative bg-white rounded-2xl shadow-sm border-2 border-orange-100 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Alerts</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">{stats.recent_alerts}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 font-medium">Last 7 days</p>
                    <Link
                      href="/dashboard/alerts"
                      className="mt-4 block text-center text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-all"
                    >
                      View Alerts →
                    </Link>
                  </div>
                </div>

                {/* Quick Add */}
                <div className="group relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-indigo-300 p-6 flex flex-col items-center justify-center hover:border-indigo-400 hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex flex-col items-center">
                    <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-4 text-center">
                      Add New Artist
                    </p>
                    <Link
                      href="/dashboard/artists/add"
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                    >
                      + Add Artist
                    </Link>
                  </div>
                </div>
              </div>

              {/* Portfolio Snapshot - New Widget */}
              <PortfolioSnapshot />

              {/* Top Tracks Table - New Widget */}
              <TopTracksTable />

              {/* Spotify Player Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SpotifyPlayerWidget
                    playlistId="37i9dQZF1DXcBWIGoYBM5M"
                    title="Featured Music"
                  />
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                        <Music className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Music Player</h3>
                        <p className="text-sm text-gray-600">Listen to your artists</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Discover and play music from your portfolio artists directly in the dashboard.
                      Click on any track to preview or open in Spotify for the full experience.
                    </p>
                  </div>

                  {artists.length > 0 && artists[0]?.spotify_id && (
                    <SpotifyPlayerWidget
                      artistId={artists[0].spotify_id}
                      title={artists[0].name}
                      compact={false}
                    />
                  )}
                </div>
              </div>

              {/* Artist Rankings - New Widget */}
              <ArtistRankings />

              {/* Performance Charts Row - Stream & Social */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StreamEvolutionV2 />
                <SocialEngagementV2 />
              </div>

              {/* Best Time to Post - New Widget */}
              <BestTimeToPostV2 />

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performers - Takes 2 columns */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Top Performers</h2>
                      <p className="text-sm text-gray-600">Ranked by momentum score</p>
                    </div>
                    <Link
                      href="/dashboard/momentum"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {topPerformers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-10 h-10 text-blue-600" />
                      </div>
                      <p className="text-gray-600 mb-4 font-medium">No artists added yet</p>
                      <Link
                        href="/dashboard/artists/add"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                      >
                        Add Your First Artist
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topPerformers.map((artist, index) => (
                        <Link
                          key={artist.id}
                          href={`/dashboard/artists/${artist.id}`}
                          className="group block p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 bg-gradient-to-r from-gray-50 to-white hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg text-lg">
                              {index + 1}
                            </div>

                            {/* Artist Image */}
                            {artist.image_url ? (
                              <img
                                src={artist.image_url}
                                alt={artist.name}
                                className="w-14 h-14 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-md">
                                <Music className="w-7 h-7 text-gray-400" />
                              </div>
                            )}

                            {/* Artist Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 truncate text-lg">{artist.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${
                                  artist.momentum_status === 'fire' ? 'bg-red-100 text-red-700' :
                                  artist.momentum_status === 'growing' ? 'bg-green-100 text-green-700' :
                                  artist.momentum_status === 'stable' ? 'bg-blue-100 text-blue-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {artist.momentum_status}
                                </span>
                                {artist.trend_7d !== null && (
                                  <span className="flex items-center gap-0.5 text-xs font-medium">
                                    {artist.trend_7d > 0 ? (
                                      <>
                                        <ArrowUp className="w-3 h-3 text-green-600" />
                                        <span className="text-green-600">+{artist.trend_7d.toFixed(1)}%</span>
                                      </>
                                    ) : artist.trend_7d < 0 ? (
                                      <>
                                        <ArrowDown className="w-3 h-3 text-red-600" />
                                        <span className="text-red-600">{artist.trend_7d.toFixed(1)}%</span>
                                      </>
                                    ) : (
                                      <span className="text-gray-600">0%</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Momentum Score */}
                            <div className="text-right">
                              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {artist.momentum_score.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-600 font-medium">Momentum</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity - Takes 1 column */}
                <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                    <p className="text-sm text-gray-600">Last 7 days</p>
                  </div>

                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="group flex gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white border border-transparent hover:border-gray-200 transition-all duration-200"
                        >
                          <div className="flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                            {getActivityIcon(activity.type, activity.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-600 truncate font-medium">
                              {activity.artist_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                <div className="relative">
                  <h2 className="text-3xl font-bold mb-2">Explore Your Analytics</h2>
                  <p className="text-blue-100 mb-8 text-lg">Deep dive into your artist portfolio</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      href="/dashboard/momentum"
                      className="group bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 hover:border-white/40 p-5 rounded-xl transition-all duration-300 flex items-center gap-4 hover:scale-105 hover:shadow-xl"
                    >
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">Momentum Index</p>
                        <p className="text-sm text-blue-100">Track growth velocity</p>
                      </div>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </Link>

                    <Link
                      href="/dashboard/superfans"
                      className="group bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 hover:border-white/40 p-5 rounded-xl transition-all duration-300 flex items-center gap-4 hover:scale-105 hover:shadow-xl"
                    >
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                        <Heart className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">Superfans</p>
                        <p className="text-sm text-blue-100">Identify top fans</p>
                      </div>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </Link>

                    <Link
                      href="/dashboard/actions"
                      className="group bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 hover:border-white/40 p-5 rounded-xl transition-all duration-300 flex items-center gap-4 hover:scale-105 hover:shadow-xl"
                    >
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                        <Zap className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">Next Best Actions</p>
                        <p className="text-sm text-blue-100">AI recommendations</p>
                      </div>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No data available</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
