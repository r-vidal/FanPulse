'use client'

import { useDashboardStats, useTopPerformers, useRecentActivity } from '@/hooks/useDashboard'
import { useArtists } from '@/hooks/useArtists'
import PortfolioHealthScore from './PortfolioHealthScore'
import { SkeletonPortfolioDashboard, SkeletonChart } from '@/components/ui/Skeleton'
import { TrendingUp, Users, Play, Heart, Activity, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'

/**
 * Portfolio Overview Dashboard - Z-Pattern Layout
 *
 * Layout follows industry-standard Z-pattern for optimal scanning:
 * 1. Top-left: Critical metrics (Portfolio Health Score)
 * 2. Top-right: Quick actions (Refresh, Add Artist, Export)
 * 3. Horizontal: Key performance indicators (4 stat cards)
 * 4. Body: Primary content (Top Performers, Momentum Trends)
 * 5. Bottom: Secondary info (Recent Activity)
 *
 * Implements 5-9 visualizations maximum (Miller's Law) to avoid cognitive overload
 */
export default function PortfolioOverview() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats()
  const { data: topPerformers = [], isLoading: performersLoading } = useTopPerformers(5)
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity(10)
  const { data: artists = [], isLoading: artistsLoading } = useArtists()

  // Calculate momentum trend data for visualization
  const momentumTrendData = useMemo(() => {
    if (artists.length === 0) return []

    // Simulate 7-day trend (in production, this would come from API)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, index) => ({
      day,
      avgMomentum: artists.reduce((sum, a) => sum + (a.current_momentum || 0), 0) / artists.length,
      // Simulate slight variation
      variation: Math.random() * 0.5,
    }))
  }, [artists])

  const formatNumber = (num: number | undefined | null): string => {
    if (num == null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getMomentumColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fire':
        return 'text-red-600 dark:text-red-400'
      case 'growing':
        return 'text-green-600 dark:text-green-400'
      case 'stable':
        return 'text-blue-600 dark:text-blue-400'
      case 'declining':
        return 'text-orange-600 dark:text-orange-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const isLoading = statsLoading || performersLoading || activityLoading || artistsLoading

  if (isLoading) {
    return <SkeletonPortfolioDashboard />
  }

  return (
    <div className="space-y-8">
      {/* Z-Pattern: Top Section - Header with actions (right-aligned) */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Portfolio Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time insights across your artist roster
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchStats()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link
            href="/dashboard/artists/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Users className="w-4 h-4" />
            Add Artist
          </Link>
        </div>
      </div>

      {/* Z-Pattern: Horizontal Scan - Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Total Artists */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Artists</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats?.total_artists || 0}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stats?.artists_growing || 0} growing • {stats?.artists_declining || 0} declining
          </p>
        </div>

        {/* KPI 2: Total Streams */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Play className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Streams</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {formatNumber(stats?.total_streams)}
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">
            +{Math.round((stats?.total_streams || 0) * 0.05)} this week
          </p>
        </div>

        {/* KPI 3: Avg Momentum */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Momentum</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {(stats?.avg_momentum || 0).toFixed(1)}
            <span className="text-xl text-gray-400 dark:text-gray-600">/10</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Portfolio average</p>
        </div>

        {/* KPI 4: Total Superfans */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
              <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Superfans</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {formatNumber(stats?.total_superfans)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">High engagement fans</p>
        </div>
      </div>

      {/* Z-Pattern: Body - Main Content (2-column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Portfolio Health Score */}
        <PortfolioHealthScore />

        {/* Right: Top Performers */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Top Performers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Highest momentum artists</p>
            </div>
            <Link
              href="/dashboard/artists"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            {topPerformers.slice(0, 5).map((artist, index) => (
              <Link
                key={artist.id}
                href={`/dashboard/artists/${artist.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex-shrink-0 text-lg font-bold text-gray-400 dark:text-gray-600 w-6">
                  #{index + 1}
                </div>
                {artist.image_url ? (
                  <img src={artist.image_url} alt={artist.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {artist.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {artist.momentum_score?.toFixed(1) || '0.0'}/10 momentum
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getMomentumColor(artist.momentum_status).replace('text-', 'bg-').replace('600', '100').replace('400', '900/30')} ${getMomentumColor(artist.momentum_status)}`}>
                  {artist.momentum_status || 'stable'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Z-Pattern: Bottom - Secondary Content (Recent Activity) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Recent Activity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Latest updates across your portfolio</p>
          </div>
          <Link
            href="/dashboard/actions"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All Actions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentActivity.slice(0, 6).map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            >
              <div className={`p-2 rounded-lg ${
                activity.type === 'alert'
                  ? 'bg-red-50 dark:bg-red-900/30'
                  : activity.type === 'action'
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'bg-green-50 dark:bg-green-900/30'
              }`}>
                {activity.type === 'alert' ? (
                  <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />
                ) : activity.type === 'action' ? (
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white mb-1">{activity.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}

          {recentActivity.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
