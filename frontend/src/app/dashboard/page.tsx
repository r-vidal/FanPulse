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
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-gray-600">
                  Welcome back, {user?.name || 'User'}! Here's your portfolio overview.
                </p>
              </div>
              {/* Artist Filter */}
              {artists.length > 0 && (
                <div className="flex items-center gap-3">
                  <label htmlFor="artist-filter" className="text-sm font-medium text-gray-700">
                    View:
                  </label>
                  <select
                    id="artist-filter"
                    value={selectedArtistId}
                    onChange={(e) => setSelectedArtistId(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="all">All Artists</option>
                    {artists.map((artist) => (
                      <option key={artist.id} value={artist.id}>
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
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-700">Growing</p>
                      <p className="text-xs text-blue-600">+{stats.artists_growing}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Total Artists</h3>
                    <p className="text-3xl font-bold text-blue-900">{stats.total_artists}</p>
                    {stats.artists_declining > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        {stats.artists_declining} declining
                      </p>
                    )}
                  </div>
                </div>

                {/* Total Streams */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-600 rounded-lg">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-purple-900 mb-1">Total Streams</h3>
                    <p className="text-3xl font-bold text-purple-900">{formatNumber(stats.total_streams)}</p>
                    <p className="text-xs text-purple-600 mt-1">Across all platforms</p>
                  </div>
                </div>

                {/* Avg Momentum */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-600 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600">Score</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-900 mb-1">Avg Momentum</h3>
                    <p className="text-3xl font-bold text-green-900">{stats.avg_momentum.toFixed(1)}/10</p>
                    <p className="text-xs text-green-600 mt-1">Portfolio average</p>
                  </div>
                </div>

                {/* Total Superfans */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-pink-600 rounded-lg">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-pink-900 mb-1">Total Superfans</h3>
                    <p className="text-3xl font-bold text-pink-900">{formatNumber(stats.total_superfans)}</p>
                    <p className="text-xs text-pink-600 mt-1">High-value fans</p>
                  </div>
                </div>
              </div>

              {/* Actions & Alerts Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Actions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pending_actions}</p>
                    </div>
                  </div>
                  {stats.critical_actions > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs font-semibold text-red-700">
                        {stats.critical_actions} Critical Priority
                      </p>
                    </div>
                  )}
                  <Link
                    href="/dashboard/actions"
                    className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View All Actions →
                  </Link>
                </div>

                {/* Recent Alerts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recent Alerts</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.recent_alerts}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Last 7 days</p>
                  <Link
                    href="/dashboard/alerts"
                    className="mt-4 block text-center text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    View Alerts →
                  </Link>
                </div>

                {/* Quick Add */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <Music className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-600 mb-3 text-center">
                    Add New Artist
                  </p>
                  <Link
                    href="/dashboard/artists/add"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    + Add Artist
                  </Link>
                </div>
              </div>

              {/* Portfolio Snapshot - New Widget */}
              <PortfolioSnapshot />

              {/* Top Tracks Table - New Widget */}
              <TopTracksTable />

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
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Top Performers</h2>
                      <p className="text-sm text-gray-600">Ranked by momentum score</p>
                    </div>
                    <Link
                      href="/dashboard/momentum"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {topPerformers.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No artists added yet</p>
                      <Link
                        href="/dashboard/artists/add"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Your First Artist
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topPerformers.map((artist, index) => (
                        <Link
                          key={artist.id}
                          href={`/dashboard/artists/${artist.id}`}
                          className={`block p-4 rounded-lg border ${getMomentumBgColor(artist.momentum_status)} hover:shadow-md transition-all`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-gray-700 shadow-sm">
                              {index + 1}
                            </div>

                            {/* Artist Image */}
                            {artist.image_url ? (
                              <img
                                src={artist.image_url}
                                alt={artist.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Music className="w-6 h-6 text-gray-400" />
                              </div>
                            )}

                            {/* Artist Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{artist.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-medium uppercase ${getMomentumColor(artist.momentum_status)}`}>
                                  {artist.momentum_status}
                                </span>
                                {artist.trend_7d !== null && (
                                  <span className="flex items-center gap-0.5 text-xs">
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
                              <div className="text-2xl font-bold text-gray-900">
                                {artist.momentum_score.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-600">Momentum</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity - Takes 1 column */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                    <p className="text-sm text-gray-600">Last 7 days</p>
                  </div>

                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getActivityIcon(activity.type, activity.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
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
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Explore Your Analytics</h2>
                <p className="text-blue-100 mb-6">Deep dive into your artist portfolio</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/dashboard/momentum"
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/20 p-4 rounded-lg transition-all flex items-center gap-3 group"
                  >
                    <TrendingUp className="w-8 h-8" />
                    <div>
                      <p className="font-semibold">Momentum Index</p>
                      <p className="text-sm text-blue-100">Track growth velocity</p>
                    </div>
                    <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/dashboard/superfans"
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/20 p-4 rounded-lg transition-all flex items-center gap-3 group"
                  >
                    <Heart className="w-8 h-8" />
                    <div>
                      <p className="font-semibold">Superfans</p>
                      <p className="text-sm text-blue-100">Identify top fans</p>
                    </div>
                    <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/dashboard/actions"
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/20 p-4 rounded-lg transition-all flex items-center gap-3 group"
                  >
                    <Zap className="w-8 h-8" />
                    <div>
                      <p className="font-semibold">Next Best Actions</p>
                      <p className="text-sm text-blue-100">AI recommendations</p>
                    </div>
                    <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
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
