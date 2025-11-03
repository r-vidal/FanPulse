/**
 * Artist Analytics Dashboard Page
 *
 * Comprehensive analytics view for a specific artist
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { StatCard } from '@/components/dashboard/StatCard'
import { FVSDisplay } from '@/components/analytics/FVSDisplay'
import { MomentumDisplay } from '@/components/analytics/MomentumDisplay'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  getArtistOverview,
  getBreakoutPrediction,
  getSuperfanInsights,
  type ArtistOverview,
  type BreakoutPrediction,
  type SuperfanInsights,
} from '@/lib/api/analytics'

export default function ArtistAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const artistId = params.artistId as string

  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<ArtistOverview | null>(null)
  const [breakoutPrediction, setBreakoutPrediction] = useState<BreakoutPrediction | null>(null)
  const [superfanInsights, setSuperfanInsights] = useState<SuperfanInsights | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    loadAnalytics()
  }, [artistId, token, isAuthenticated])

  const loadAnalytics = async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)

      // Load all analytics data
      const [overviewData, breakoutData, superfanData] = await Promise.all([
        getArtistOverview(artistId, token),
        getBreakoutPrediction(artistId, token).catch(() => null),
        getSuperfanInsights(artistId, token).catch(() => null),
      ])

      setOverview(overviewData)
      setBreakoutPrediction(breakoutData)
      setSuperfanInsights(superfanData)
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getPredictionBadge = (prediction: string) => {
    switch (prediction) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Failed to load analytics'}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{overview.artist_name}</h1>
          <p className="text-gray-600 mt-1">Analytics Dashboard</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Followers"
            value={formatNumber(overview.total_followers)}
            subtitle="Across all platforms"
            color="blue"
          />
          <StatCard
            title="Monthly Listeners"
            value={formatNumber(overview.total_monthly_listeners)}
            subtitle="Streaming platforms"
            color="green"
          />
          <StatCard
            title="Superfans"
            value={overview.superfan_count}
            subtitle="Highly engaged fans"
            color="purple"
          />
          <StatCard
            title="Connected Platforms"
            value={overview.platform_count}
            subtitle="Active integrations"
            color="orange"
          />
        </div>

        {/* FVS and Momentum */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {overview.fvs && <FVSDisplay data={overview.fvs} />}
          {overview.momentum && <MomentumDisplay data={overview.momentum} />}
        </div>

        {/* Breakout Prediction */}
        {breakoutPrediction && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Breakout Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getPredictionBadge(breakoutPrediction.prediction)}`}
                    >
                      {breakoutPrediction.prediction.toUpperCase()} PROBABILITY
                    </span>
                    <span className="text-3xl font-bold text-gray-900">
                      {(breakoutPrediction.probability * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={breakoutPrediction.indicators.accelerating_growth ? 'text-green-600' : 'text-gray-400'}>
                        {breakoutPrediction.indicators.accelerating_growth ? '✓' : '○'}
                      </span>
                      <span className="text-sm text-gray-700">Accelerating Growth</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={breakoutPrediction.indicators.viral_content ? 'text-green-600' : 'text-gray-400'}>
                        {breakoutPrediction.indicators.viral_content ? '✓' : '○'}
                      </span>
                      <span className="text-sm text-gray-700">Viral Content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={breakoutPrediction.indicators.high_velocity ? 'text-green-600' : 'text-gray-400'}>
                        {breakoutPrediction.indicators.high_velocity ? '✓' : '○'}
                      </span>
                      <span className="text-sm text-gray-700">High Velocity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={breakoutPrediction.indicators.consistent_growth ? 'text-green-600' : 'text-gray-400'}>
                        {breakoutPrediction.indicators.consistent_growth ? '✓' : '○'}
                      </span>
                      <span className="text-sm text-gray-700">Consistent Growth</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Recommendation</p>
                    <p className="text-sm text-blue-700">{breakoutPrediction.recommendation}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Superfan Insights */}
        {superfanInsights && (
          <Card>
            <CardHeader>
              <CardTitle>Superfan Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Superfans</p>
                  <p className="text-2xl font-bold text-gray-900">{superfanInsights.total_superfans}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active (30 days)</p>
                  <p className="text-2xl font-bold text-gray-900">{superfanInsights.active_last_30_days}</p>
                  <p className="text-sm text-gray-500">{superfanInsights.activity_rate}% activity rate</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg. Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">{superfanInsights.average_engagement_score.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">out of 10</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total LTV</p>
                  <p className="text-2xl font-bold text-gray-900">${superfanInsights.total_lifetime_value.toFixed(0)}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Tier Distribution</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20">Platinum</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${(superfanInsights.tier_distribution.platinum / superfanInsights.total_superfans) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {superfanInsights.tier_distribution.platinum}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20">Gold</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${(superfanInsights.tier_distribution.gold / superfanInsights.total_superfans) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {superfanInsights.tier_distribution.gold}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20">Silver</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full"
                        style={{
                          width: `${(superfanInsights.tier_distribution.silver / superfanInsights.total_superfans) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {superfanInsights.tier_distribution.silver}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20">Bronze</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{
                          width: `${(superfanInsights.tier_distribution.bronze / superfanInsights.total_superfans) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {superfanInsights.tier_distribution.bronze}
                    </span>
                  </div>
                </div>
              </div>

              {superfanInsights.top_locations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Top Locations</p>
                  <div className="space-y-2">
                    {superfanInsights.top_locations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{location.location}</span>
                        <span className="text-sm font-medium text-gray-900">{location.count} fans</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
