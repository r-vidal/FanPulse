'use client'

import { useMemo } from 'react'
import { useArtists } from '@/hooks/useArtists'
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle2 } from 'lucide-react'

interface HealthMetrics {
  score: number // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor'
  artistsGrowing: number
  artistsDeclining: number
  avgMomentum: number
  totalStreams: number
  totalSuperfans: number
  healthFactors: {
    momentum: number // Weight: 40%
    growth: number // Weight: 30%
    engagement: number // Weight: 30%
  }
}

export default function PortfolioHealthScore() {
  const { data: artists = [], isLoading } = useArtists()

  // Calculate comprehensive health metrics
  const healthMetrics = useMemo((): HealthMetrics => {
    if (artists.length === 0) {
      return {
        score: 0,
        status: 'poor',
        artistsGrowing: 0,
        artistsDeclining: 0,
        avgMomentum: 0,
        totalStreams: 0,
        totalSuperfans: 0,
        healthFactors: { momentum: 0, growth: 0, engagement: 0 },
      }
    }

    // Count artists by momentum status
    const growing = artists.filter((a) => a.momentum_status === 'growing' || a.momentum_status === 'fire').length
    const declining = artists.filter((a) => a.momentum_status === 'declining').length

    // Calculate averages
    const avgMomentum = artists.reduce((sum, a) => sum + (a.current_momentum || 0), 0) / artists.length
    const totalStreams = artists.reduce((sum, a) => sum + (a.total_streams || 0), 0)
    const totalSuperfans = artists.reduce((sum, a) => sum + (a.total_superfans || 0), 0)

    // Health factor calculations
    // 1. Momentum Factor (40%): Based on average momentum score
    const momentumFactor = (avgMomentum / 10) * 100 // Normalize to 0-100

    // 2. Growth Factor (30%): Ratio of growing to total artists
    const growthFactor = (growing / artists.length) * 100

    // 3. Engagement Factor (30%): Based on superfans per artist
    const avgSuperfansPerArtist = totalSuperfans / artists.length
    const engagementFactor = Math.min((avgSuperfansPerArtist / 100) * 100, 100) // Cap at 100

    // Calculate weighted health score
    const score = Math.round(momentumFactor * 0.4 + growthFactor * 0.3 + engagementFactor * 0.3)

    // Determine status
    let status: 'excellent' | 'good' | 'fair' | 'poor'
    if (score >= 80) status = 'excellent'
    else if (score >= 60) status = 'good'
    else if (score >= 40) status = 'fair'
    else status = 'poor'

    return {
      score,
      status,
      artistsGrowing: growing,
      artistsDeclining: declining,
      avgMomentum,
      totalStreams,
      totalSuperfans,
      healthFactors: {
        momentum: Math.round(momentumFactor),
        growth: Math.round(growthFactor),
        engagement: Math.round(engagementFactor),
      },
    }
  }, [artists])

  // Color scheme based on status
  const statusConfig = {
    excellent: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      icon: CheckCircle2,
      label: 'Excellent',
    },
    good: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      icon: CheckCircle2,
      label: 'Good',
    },
    fair: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: AlertCircle,
      label: 'Fair',
    },
    poor: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      icon: AlertCircle,
      label: 'Needs Attention',
    },
  }

  const config = statusConfig[healthMetrics.status]
  const StatusIcon = config.icon

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-6`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Portfolio Health Score</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Overall performance across {artists.length} artist{artists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} border ${config.border}`}>
          <StatusIcon className={`w-4 h-4 ${config.text}`} />
          <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          {/* Circular Progress */}
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              className={config.text}
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - healthMetrics.score / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>

          {/* Score Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${config.text}`}>{healthMetrics.score}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">out of 100</span>
          </div>
        </div>
      </div>

      {/* Health Factors Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {healthMetrics.healthFactors.momentum}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Momentum</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">40% weight</div>
        </div>
        <div className="text-center border-x border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {healthMetrics.healthFactors.growth}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Growth</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">30% weight</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {healthMetrics.healthFactors.engagement}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Engagement</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">30% weight</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {healthMetrics.artistsGrowing}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Artists Growing</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {healthMetrics.artistsDeclining}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Artists Declining</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {healthMetrics.status === 'poor' && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-400 mb-1">Action Required</p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Your portfolio health is below optimal levels. Review declining artists and consider reallocation of
                resources to growing talent.
              </p>
            </div>
          </div>
        </div>
      )}

      {healthMetrics.status === 'excellent' && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-400 mb-1">Outstanding Performance</p>
              <p className="text-xs text-green-700 dark:text-green-300">
                Your portfolio is performing exceptionally well. Continue current strategies and consider expanding your
                roster.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
