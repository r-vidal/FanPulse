'use client'

/**
 * Superfans Page
 *
 * Top 20 superfans for each artist with FVS scores and engagement metrics
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SuperfanCard from '@/components/superfans/SuperfanCard'
import Alert from '@/components/ui/Alert'
import { superfansApi, Superfan, SuperfanInsights } from '@/lib/api/superfans'
import { api } from '@/lib/api'
import { Heart, Loader2, Users, Download } from 'lucide-react'

interface Artist {
  id: string
  name: string
  image_url: string | null
}

interface ArtistWithSuperfans extends Artist {
  superfans: Superfan[]
  insights: SuperfanInsights | null
  loading: boolean
  error: string | null
}

export default function SuperfansPage() {
  const router = useRouter()
  const [artists, setArtists] = useState<ArtistWithSuperfans[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null)
  const [minScore, setMinScore] = useState(70)

  useEffect(() => {
    loadArtists()
  }, [])

  useEffect(() => {
    if (selectedArtistId) {
      loadSuperfans(selectedArtistId)
    }
  }, [minScore, selectedArtistId])

  const loadArtists = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get('/api/artists/')
      const artistsList: Artist[] = response.data

      const artistsWithSuperfans: ArtistWithSuperfans[] = artistsList.map(artist => ({
        ...artist,
        superfans: [],
        insights: null,
        loading: false,
        error: null
      }))

      setArtists(artistsWithSuperfans)

      // Auto-select first artist if available
      if (artistsList.length > 0) {
        setSelectedArtistId(artistsList[0].id)
      }
    } catch (err: any) {
      console.error('Failed to load artists:', err)
      setError(err.response?.data?.detail || 'Failed to load artists')
    } finally {
      setLoading(false)
    }
  }

  const loadSuperfans = async (artistId: string) => {
    try {
      // Update loading state
      setArtists(prev =>
        prev.map(a => (a.id === artistId ? { ...a, loading: true, error: null } : a))
      )

      // Load superfans list and insights in parallel
      const [listResponse, insightsResponse] = await Promise.allSettled([
        superfansApi.list(artistId, minScore / 10, 90),
        superfansApi.getInsights(artistId)
      ])

      const superfans = listResponse.status === 'fulfilled' ? listResponse.value.superfans : []
      const insights = insightsResponse.status === 'fulfilled' ? insightsResponse.value : null

      // Sort by FVS score (highest first) and take top 20
      const topSuperfans = superfans
        .sort((a, b) => b.fvs_score - a.fvs_score)
        .slice(0, 20)

      setArtists(prev =>
        prev.map(a =>
          a.id === artistId
            ? { ...a, superfans: topSuperfans, insights, loading: false }
            : a
        )
      )
    } catch (err: any) {
      console.error('Failed to load superfans:', err)
      setArtists(prev =>
        prev.map(a =>
          a.id === artistId
            ? { ...a, error: 'Failed to load superfans', loading: false }
            : a
        )
      )
    }
  }

  const exportSuperfans = () => {
    const selectedArtist = artists.find(a => a.id === selectedArtistId)
    if (!selectedArtist || selectedArtist.superfans.length === 0) return

    // Create CSV
    const headers = ['Rank', 'Platform ID', 'FVS Score', 'Listening Hours', 'Engagement', 'Monetization', 'Location']
    const rows = selectedArtist.superfans.map((fan, index) => [
      index + 1,
      fan.platform_user_id,
      fan.fvs_score.toFixed(2),
      fan.listening_hours.toFixed(2),
      fan.engagement_score.toFixed(2),
      fan.monetization_score.toFixed(2),
      fan.location || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedArtist.name.replace(/\s+/g, '_')}_superfans_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const selectedArtist = artists.find(a => a.id === selectedArtistId)

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Heart className="w-8 h-8 text-pink-600" />
                Superfans
              </h1>
              <p className="mt-2 text-gray-600">
                Your top 20 most engaged fans by Fan Value Score (FVS)
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading artists...</span>
            </div>
          )}

          {/* Content */}
          {!loading && artists.length > 0 && (
            <>
              {/* Artist Selector & Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  {/* Artist Selector */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Artist
                    </label>
                    <select
                      value={selectedArtistId || ''}
                      onChange={(e) => setSelectedArtistId(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {artists.map(artist => (
                        <option key={artist.id} value={artist.id}>
                          {artist.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Min Score Filter */}
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min FVS Score: {minScore}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={minScore}
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      className="w-48"
                    />
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={exportSuperfans}
                    disabled={!selectedArtist || selectedArtist.superfans.length === 0}
                    className="ml-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {/* Insights Stats */}
                {selectedArtist?.insights && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Total Superfans</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedArtist.insights.total_superfans}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Active (30d)</div>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedArtist.insights.active_last_30_days}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Avg Engagement</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedArtist.insights.average_engagement_score.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Total LTV</div>
                      <div className="text-2xl font-bold text-purple-600">
                        ${selectedArtist.insights.total_lifetime_value.toFixed(0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Superfans List */}
              {selectedArtist && (
                <div>
                  {selectedArtist.loading ? (
                    <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <span className="ml-3 text-gray-600">Loading superfans...</span>
                    </div>
                  ) : selectedArtist.error ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                      <p className="text-red-600">{selectedArtist.error}</p>
                    </div>
                  ) : selectedArtist.superfans.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No superfans found
                      </h3>
                      <p className="text-gray-600">
                        No fans meet the minimum FVS score of {minScore}. Try lowering the threshold.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Top {selectedArtist.superfans.length} Superfans
                        </h2>
                        <p className="text-sm text-gray-600">
                          Ranked by Fan Value Score (FVS)
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedArtist.superfans.map((superfan, index) => (
                          <SuperfanCard
                            key={superfan.id}
                            superfan={superfan}
                            rank={index + 1}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* No Artists */}
          {!loading && artists.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No artists yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add artists to start tracking your superfans
              </p>
              <button
                onClick={() => router.push('/dashboard/artists/add')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Artist
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
