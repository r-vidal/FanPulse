'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { releasesApi } from '@/lib/api/releases'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Calendar, TrendingUp, Users, Sparkles, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import type { ReleaseOptimization, ReleaseScore } from '@/types'

interface Artist {
  id: string
  name: string
}

export default function ReleaseOptimizerPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedArtist, setSelectedArtist] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [optimization, setOptimization] = useState<ReleaseOptimization | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArtists()
    // Set default dates (today + 90 days)
    const today = new Date()
    const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(in90Days.toISOString().split('T')[0])
  }, [])

  const fetchArtists = async () => {
    try {
      const response = await api.get('/api/artists/')
      setArtists(response.data)
      if (response.data.length > 0) {
        setSelectedArtist(response.data[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch artists:', err)
      setError('Failed to load artists')
    }
  }

  const handleOptimize = async () => {
    if (!selectedArtist || !startDate || !endDate) {
      setError('Please select an artist and date range')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await releasesApi.getOptimalDates(selectedArtist, startDate, endDate)
      setOptimization(data)
    } catch (err: any) {
      console.error('Failed to optimize:', err)
      setError(err.response?.data?.detail || 'Failed to calculate optimal dates')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const renderFactorBars = (factors: ReleaseScore['factors']) => {
    const factorLabels = {
      momentum: { label: 'Momentum', icon: TrendingUp },
      competition: { label: 'Competition', icon: AlertTriangle },
      seasonal: { label: 'Seasonal', icon: Calendar },
      fan_readiness: { label: 'Fan Readiness', icon: Users },
      platform_trends: { label: 'Platform Trends', icon: Sparkles },
    }

    return (
      <div className="space-y-3">
        {Object.entries(factors).map(([key, value]) => {
          const factor = factorLabels[key as keyof typeof factors]
          const Icon = factor.icon
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{factor.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{value}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    value >= 8 ? 'bg-green-500' :
                    value >= 6 ? 'bg-blue-500' :
                    value >= 4 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${value * 10}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderScoreCard = (score: ReleaseScore, isOptimal: boolean) => (
    <div
      key={score.id}
      className={`border-2 rounded-lg p-6 ${
        isOptimal ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isOptimal ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
            <h3 className="text-lg font-bold text-gray-900">
              {formatDate(score.release_date)}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {isOptimal ? 'Recommended Release Date' : 'Avoid This Date'}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg ${getScoreColor(score.score)}`}>
          <div className="text-3xl font-bold">{score.score}</div>
          <div className="text-xs">/ 100</div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Factor Breakdown</h4>
        {renderFactorBars(score.factors)}
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {score.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Release Optimizer</h2>
            <p className="mt-2 text-gray-600">
              Find the optimal release dates based on momentum, competition, and market trends
            </p>
          </div>

          {/* Configuration Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Analysis</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Artist Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Artist
                </label>
                <select
                  value={selectedArtist}
                  onChange={(e) => setSelectedArtist(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <Button
              onClick={handleOptimize}
              disabled={loading || !selectedArtist}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Find Optimal Dates'}
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Results */}
          {optimization && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-8 h-8" />
                    <h3 className="text-lg font-semibold">Best Score</h3>
                  </div>
                  <p className="text-5xl font-bold mb-2">{optimization.best_score}</p>
                  <p className="text-green-100">Highest rating in date range</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-8 h-8" />
                    <h3 className="text-lg font-semibold">Worst Score</h3>
                  </div>
                  <p className="text-5xl font-bold mb-2">{optimization.worst_score}</p>
                  <p className="text-red-100">Lowest rating in date range</p>
                </div>
              </div>

              {/* Optimal Dates */}
              {optimization.optimal_dates.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    ✅ Recommended Release Dates
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {optimization.optimal_dates.map((score) => renderScoreCard(score, true))}
                  </div>
                </div>
              )}

              {/* Dates to Avoid */}
              {optimization.avoid_dates.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    ⚠️ Dates to Avoid
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {optimization.avoid_dates.map((score) => renderScoreCard(score, false))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!optimization && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <Calendar className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Ready to Find Your Perfect Release Date?
              </h3>
              <p className="text-blue-700">
                Select an artist and date range above, then click "Find Optimal Dates" to get started.
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
