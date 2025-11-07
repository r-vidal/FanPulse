'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { useArtistContext } from '@/contexts/ArtistContext'
import AnalyticsPageHeader from '@/components/ui/AnalyticsPageHeader'
import Alert from '@/components/ui/Alert'
import { SkeletonStats, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton'
import { dashboardApi, DashboardStats, TopArtist, RecentActivity } from '@/lib/api/dashboard'
import {
  Music, TrendingUp, Heart, Zap, AlertCircle, Users,
  Activity, CheckCircle, ArrowRight, ArrowUp, ArrowDown,
  BarChart3, Target, Clock, Play
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { selectedArtist, isAllArtists } = useArtistContext()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topPerformers, setTopPerformers] = useState<TopArtist[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [selectedArtist])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const artistIdParam = selectedArtist?.id || 'all'
      const [statsData, topPerformersData, activityData] = await Promise.all([
        dashboardApi.getStats(artistIdParam),
        dashboardApi.getTopPerformers(5, artistIdParam),
        dashboardApi.getRecentActivity(8, artistIdParam)
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

  const getActivityIcon = (type: string, severity?: string) => {
    if (type === 'alert') {
      if (severity === 'urgent') return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
    }
    if (type === 'action') return <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    return <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
          {/* Artist Context Header */}
          <AnalyticsPageHeader showMockDataNotice={false} />

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isAllArtists
                ? "Welcome back! Here's your portfolio overview."
                : `Analytics for ${selectedArtist?.name}`
              }
            </p>
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
            </>
          ) : stats ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Artists */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    {stats.artists_growing > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded-md">
                        <ArrowUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">+{stats.artists_growing}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Artists</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_artists}</p>
                  {stats.artists_declining > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {stats.artists_declining} declining
                    </p>
                  )}
                </div>

                {/* Total Streams */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                      <Play className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Streams</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.total_streams)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Across all platforms</p>
                </div>

                {/* Avg Momentum */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-500">Score</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Momentum</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.avg_momentum.toFixed(1)}<span className="text-xl text-gray-400 dark:text-gray-600">/10</span></p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Portfolio average</p>
                </div>

                {/* Total Superfans */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
                      <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Superfans</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.total_superfans)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">High-value fans</p>
                </div>
              </div>

              {/* Actions & Alerts Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pending Actions */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Actions</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending_actions}</p>
                    </div>
                  </div>
                  {stats.critical_actions > 0 && (
                    <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                        {stats.critical_actions} Critical Priority
                      </p>
                    </div>
                  )}
                  <Link
                    href="/dashboard/actions"
                    className="flex items-center justify-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    View All Actions
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Recent Alerts */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Alerts</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recent_alerts}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Last 7 days</p>
                  <Link
                    href="/dashboard/alerts"
                    className="flex items-center justify-center gap-1 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                  >
                    View Alerts
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Quick Add */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 flex flex-col items-center justify-center hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                  <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-lg mb-3">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Add New Artist
                  </p>
                  <Link
                    href="/dashboard/artists/add"
                    className="px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    + Add Artist
                  </Link>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performers - Takes 2 columns */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Performers</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Ranked by momentum score</p>
                    </div>
                    <Link
                      href="/dashboard/momentum"
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {topPerformers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">No artists added yet</p>
                      <Link
                        href="/dashboard/artists/add"
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                      >
                        Add Your First Artist
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topPerformers.map((artist, index) => (
                        <Link
                          key={artist.id}
                          href={`/dashboard/artists/${artist.id}`}
                          className="group block p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-700 flex items-center justify-center font-bold text-white text-sm">
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
                              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Music className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                              </div>
                            )}

                            {/* Artist Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{artist.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  artist.momentum_status === 'fire' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                  artist.momentum_status === 'growing' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                  artist.momentum_status === 'stable' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                  'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                }`}>
                                  {artist.momentum_status}
                                </span>
                                {artist.trend_7d !== null && (
                                  <span className="flex items-center gap-0.5 text-xs font-medium">
                                    {artist.trend_7d > 0 ? (
                                      <>
                                        <ArrowUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                        <span className="text-green-600 dark:text-green-400">+{artist.trend_7d.toFixed(1)}%</span>
                                      </>
                                    ) : artist.trend_7d < 0 ? (
                                      <>
                                        <ArrowDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        <span className="text-red-600 dark:text-red-400">{artist.trend_7d.toFixed(1)}%</span>
                                      </>
                                    ) : (
                                      <span className="text-gray-500 dark:text-gray-500">0%</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Momentum Score */}
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {artist.momentum_score.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">Momentum</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity - Takes 1 column */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Last 7 days</p>
                  </div>

                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getActivityIcon(activity.type, activity.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {activity.artist_name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
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
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Explore Your Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400">Deep dive into your artist portfolio</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/dashboard/momentum"
                    className="group flex items-center gap-4 p-5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Momentum Index</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Track growth velocity</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link
                    href="/dashboard/superfans"
                    className="group flex items-center gap-4 p-5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all"
                  >
                    <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50 transition-colors">
                      <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Superfans</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Identify top fans</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-pink-600 dark:group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link
                    href="/dashboard/actions"
                    className="group flex items-center gap-4 p-5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                  >
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                      <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Next Best Actions</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">AI recommendations</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No data available</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
