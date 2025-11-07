'use client'

/**
 * Dashboard Home Page - Complete Redesign for Q1 2026
 *
 * 7 Sections as per Master Plan:
 * 1. KPI Cards (Momentum Score, Projected Revenue, Superfans Count)
 * 2. Next Actions Widget (Top 3 actions)
 * 3. Momentum Evolution Chart (90 days)
 * 4. Recent Alerts (5 latest)
 * 5. Streams Evolution (30 days)
 * 6. Social Engagement (IG + TikTok + YouTube)
 * 7. Best Time to Post (Heatmap)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useArtistContext } from '@/contexts/ArtistContext'
import {
  TrendingUp, TrendingDown, Minus, DollarSign, Users, Zap,
  ArrowRight, Play, Calendar, Instagram, Music2, Youtube,
  Clock, AlertCircle, CheckCircle2, Target, Activity,
  BarChart3, Heart, Flame, Bell
} from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function DashboardHomePage() {
  const router = useRouter()
  const { selectedArtist, isAllArtists } = useArtistContext()
  const [loading, setLoading] = useState(true)

  // Mock data - TODO: Replace with real API calls
  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setLoading(false), 800)
  }, [selectedArtist])

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8 pb-12">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isAllArtists ? 'Portfolio Overview' : selectedArtist?.name || 'Dashboard'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isAllArtists
                ? "Your complete portfolio analytics at a glance"
                : `Actionable insights for ${selectedArtist?.name || 'your artist'}`
              }
            </p>
          </div>

          {/* SECTION 1: KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Momentum Score"
              value={87}
              max={100}
              trend="up"
              change={12}
              period="7 days"
              icon={<Activity className="w-6 h-6" />}
              color="blue"
              link="/dashboard/momentum"
            />
            <KPICard
              title="Projected Revenue"
              value="€14,200"
              subtitle="Next 30 days"
              trend="up"
              change={8}
              period="vs last month"
              icon={<DollarSign className="w-6 h-6" />}
              color="green"
              link="/dashboard/forecasts"
            />
            <KPICard
              title="Superfans"
              value={247}
              subtitle="FVS > 70"
              trend="up"
              change={23}
              period="this month"
              icon={<Heart className="w-6 h-6" />}
              color="purple"
              link="/dashboard/superfans"
            />
          </div>

          {/* SECTION 2: Next Actions Widget */}
          <NextActionsWidget />

          {/* SECTION 3 & 4: Momentum Chart + Alerts (Side by Side) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Momentum Evolution Chart (2/3 width) */}
            <div className="lg:col-span-2">
              <MomentumEvolutionChart />
            </div>

            {/* Recent Alerts (1/3 width) */}
            <div className="lg:col-span-1">
              <RecentAlertsWidget />
            </div>
          </div>

          {/* SECTION 5 & 6: Streams + Social (Side by Side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Streams Evolution */}
            <StreamsEvolutionChart />

            {/* Social Engagement */}
            <SocialEngagementChart />
          </div>

          {/* SECTION 7: Best Time to Post */}
          <BestTimeToPostHeatmap />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// ============================================================================
// SECTION 1: KPI Card Component
// ============================================================================

interface KPICardProps {
  title: string
  value: string | number
  max?: number
  subtitle?: string
  trend: 'up' | 'down' | 'neutral'
  change: number
  period: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'red'
  link: string
}

function KPICard({ title, value, max, subtitle, trend, change, period, icon, color, link }: KPICardProps) {
  const colors = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
      text: 'text-green-600 dark:text-green-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
      text: 'text-purple-600 dark:text-purple-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
      text: 'text-red-600 dark:text-red-400'
    }
  }

  const trendIcon = trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'

  return (
    <Link href={link}>
      <div className={`${colors[color].bg} border ${colors[color].border} rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 ${colors[color].icon} rounded-lg`}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 ${trendColor} text-sm font-semibold`}>
            {trendIcon}
            {change > 0 ? '+' : ''}{change}%
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>

        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' && max ? `${value}` : value}
          </p>
          {max && <span className="text-lg text-gray-500 dark:text-gray-400">/ {max}</span>}
        </div>

        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{subtitle}</p>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">{period}</p>

        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          View details
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}

// ============================================================================
// SECTION 2: Next Actions Widget
// ============================================================================

function NextActionsWidget() {
  const actions = [
    {
      id: '1',
      urgency: 'critical' as const,
      title: 'Post on Instagram NOW',
      description: 'Your audience is 3x more active in the next 2 hours (18h-20h)',
      deadline: 'Today 20h00',
      icon: <Instagram className="w-5 h-5" />
    },
    {
      id: '2',
      urgency: 'high' as const,
      title: 'Respond to VIP superfan',
      description: '@julie_music tagged you 5 times this week (FVS: 94/100)',
      effort: '5 min',
      icon: <Heart className="w-5 h-5" />
    },
    {
      id: '3',
      urgency: 'medium' as const,
      title: 'Pitch Discover Weekly',
      description: 'Your momentum is optimal (87/100) for playlist pitching',
      deadline: 'Friday 16h',
      icon: <Music2 className="w-5 h-5" />
    }
  ]

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Next Best Actions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI-generated top 3 priorities</p>
          </div>
        </div>
        <Link href="/dashboard/actions" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <ActionCard key={action.id} action={action} index={index} />
        ))}
      </div>
    </div>
  )
}

function ActionCard({ action, index }: { action: any, index: number }) {
  const urgencyColors = {
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border-2 ${urgencyColors[action.urgency]} rounded-lg p-4 hover:shadow-md transition-all cursor-pointer`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded">
            #{index + 1}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 ${urgencyColors[action.urgency]} rounded text-xs font-bold uppercase`}>
              {action.urgency}
            </span>
            {action.deadline && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {action.deadline}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
        </div>
        <div className="flex-shrink-0">
          {action.icon}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION 3: Momentum Evolution Chart
// ============================================================================

function MomentumEvolutionChart() {
  // Mock data for 90 days
  const data = Array.from({ length: 90 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (89 - i))

    // Create realistic momentum curve with some volatility
    const trend = 50 + (i / 90) * 37 // General upward trend from 50 to 87
    const volatility = Math.sin(i / 10) * 8 // Add some wave pattern
    const noise = (Math.random() - 0.5) * 5 // Random noise
    const momentum = Math.max(0, Math.min(100, trend + volatility + noise))

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      momentum: Math.round(momentum),
      zone: momentum >= 75 ? 'growth' : momentum >= 50 ? 'stable' : 'decline'
    }
  })

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Momentum Evolution</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Last 90 days performance trajectory</p>
        </div>
        <Link href="/dashboard/momentum" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          Details
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              interval={14}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
            />
            <Area
              type="monotone"
              dataKey="momentum"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#momentumGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Zone indicators */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Growth (75-100)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Stable (50-75)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Decline (0-50)</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION 4: Recent Alerts Widget
// ============================================================================

function RecentAlertsWidget() {
  const alerts = [
    {
      id: '1',
      type: 'viral_spike' as const,
      title: 'Viral Spike Detected',
      message: '+340% streams in 6h',
      timestamp: '30m ago',
      artist: 'Drake'
    },
    {
      id: '2',
      type: 'playlist_add' as const,
      title: 'Added to "Indie Gems"',
      message: '50K followers playlist',
      timestamp: '2h ago',
      artist: 'Sophie Martin'
    },
    {
      id: '3',
      type: 'fan_spike' as const,
      title: 'Fan Growth Spike',
      message: '+850 followers in 24h',
      timestamp: '5h ago',
      artist: 'Alex Laurent'
    },
    {
      id: '4',
      type: 'best_time_post' as const,
      title: 'Optimal Post Window',
      message: 'Peak activity next 2h',
      timestamp: '6h ago',
      artist: 'Maya Rivers'
    },
    {
      id: '5',
      type: 'momentum_drop' as const,
      title: 'Momentum Declining',
      message: '-15% over 7 days',
      timestamp: '1d ago',
      artist: 'Leo Martinez'
    }
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'viral_spike': return <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />
      case 'playlist_add': return <Music2 className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'fan_spike': return <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case 'best_time_post': return <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      case 'momentum_drop': return <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      default: return <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Recent Alerts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Last 5 notifications</p>
        </div>
        <Link href="/dashboard/alerts" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">{alert.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{alert.message}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                <span>{alert.artist}</span>
                <span>•</span>
                <span>{alert.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// SECTION 5: Streams Evolution Chart
// ============================================================================

function StreamsEvolutionChart() {
  // Mock data for 30 days
  const data = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))

    const base = 15000
    const trend = (i / 30) * 5000
    const noise = (Math.random() - 0.5) * 2000
    const streams = Math.max(0, base + trend + noise)

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      streams: Math.round(streams),
      spotify: Math.round(streams * 0.65),
      apple: Math.round(streams * 0.20),
      youtube: Math.round(streams * 0.15)
    }
  })

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Streams Evolution</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Last 30 days by platform</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="font-semibold text-green-600 dark:text-green-400">+24%</span>
          <span className="text-gray-500 dark:text-gray-400">vs prev period</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="spotifyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1DB954" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              interval={4}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
              formatter={(value: number) => value.toLocaleString()}
            />
            <Area
              type="monotone"
              dataKey="streams"
              stroke="#1DB954"
              strokeWidth={2}
              fill="url(#spotifyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Platform breakdown */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Spotify</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">65%</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Apple Music</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">20%</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">YouTube</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">15%</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION 6: Social Engagement Chart
// ============================================================================

function SocialEngagementChart() {
  // Mock data for 30 days
  const data = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))

    const baseIG = 800
    const baseTikTok = 1200
    const baseYT = 400

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      instagram: Math.round(baseIG + (Math.random() - 0.5) * 200),
      tiktok: Math.round(baseTikTok + (Math.random() - 0.5) * 300),
      youtube: Math.round(baseYT + (Math.random() - 0.5) * 100)
    }
  })

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Social Engagement</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cross-platform performance</p>
        </div>
        <Link href="/dashboard/social-roi" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          Details
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              interval={4}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="instagram"
              stroke="#E4405F"
              strokeWidth={2}
              dot={false}
              name="Instagram"
            />
            <Line
              type="monotone"
              dataKey="tiktok"
              stroke="#000000"
              strokeWidth={2}
              dot={false}
              name="TikTok"
            />
            <Line
              type="monotone"
              dataKey="youtube"
              stroke="#FF0000"
              strokeWidth={2}
              dot={false}
              name="YouTube"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Instagram className="w-4 h-4 text-pink-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Instagram</span>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">4.2% rate</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Music2 className="w-4 h-4 text-black dark:text-white" />
            <span className="text-xs text-gray-600 dark:text-gray-400">TikTok</span>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">8.7% rate</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Youtube className="w-4 h-4 text-red-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">YouTube</span>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">2.3% rate</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION 7: Best Time to Post Heatmap
// ============================================================================

function BestTimeToPostHeatmap() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = ['6am', '9am', '12pm', '3pm', '6pm', '9pm']

  // Mock heatmap data (0-100 activity score)
  const heatmapData = days.map(day =>
    hours.map(hour => ({
      day,
      hour,
      activity: Math.random() * 100
    }))
  ).flat()

  const getColor = (activity: number) => {
    if (activity >= 75) return 'bg-green-600'
    if (activity >= 50) return 'bg-yellow-500'
    if (activity >= 25) return 'bg-orange-500'
    return 'bg-gray-300 dark:bg-gray-700'
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Best Time to Post</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Audience activity heatmap</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Optimal: Today 6-8pm</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hours header */}
          <div className="flex mb-2">
            <div className="w-16"></div>
            {hours.map(hour => (
              <div key={hour} className="flex-1 text-center text-xs text-gray-600 dark:text-gray-400 min-w-[60px]">
                {hour}
              </div>
            ))}
          </div>

          {/* Days rows */}
          {days.map(day => (
            <div key={day} className="flex mb-2">
              <div className="w-16 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                {day}
              </div>
              {hours.map(hour => {
                const cell = heatmapData.find(d => d.day === day && d.hour === hour)
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`flex-1 h-10 ${getColor(cell?.activity || 0)} rounded mx-1 cursor-pointer hover:opacity-80 transition-opacity min-w-[60px]`}
                    title={`${day} ${hour}: ${Math.round(cell?.activity || 0)}% active`}
                  ></div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Low (0-25%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Medium (25-50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Good (50-75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Optimal (75-100%)</span>
        </div>
      </div>

      {/* Today's recommendation */}
      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-600 rounded-lg flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">🎯 Post NOW for maximum reach</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your audience is <strong>3x more active</strong> in the next 2 hours (6pm-8pm).
              Posts at this time historically perform 2.3x better.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
