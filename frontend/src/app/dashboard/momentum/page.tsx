'use client'

/**
 * Momentum Index Page
 *
 * Detailed momentum view for all artists with filtering
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import MomentumBadge from '@/components/momentum/MomentumBadge'
import MomentumBreakdown from '@/components/momentum/MomentumBreakdown'
import Alert from '@/components/ui/Alert'
import { momentumApi, MomentumData } from '@/lib/api/momentum'
import { api } from '@/lib/api'
import { Activity, Loader2, ChevronRight } from 'lucide-react'

interface Artist {
  id: string
  name: string
  image_url: string | null
  spotify_id: string | null
}

interface ArtistWithMomentum extends Artist {
  momentum: MomentumData | null
  loading: boolean
  error: string | null
}

export default function MomentumPage() {
  const router = useRouter()
  const [artists, setArtists] = useState<ArtistWithMomentum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithMomentum | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'fire' | 'growing' | 'stable' | 'declining'>('all')

  useEffect(() => {
    loadArtists()
  }, [])

  const loadArtists = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load artists
      const response = await api.get('/api/artists/')
      const artistsList: Artist[] = response.data

      // Initialize with loading state
      const artistsWithMomentum: ArtistWithMomentum[] = artistsList.map(artist => ({
        ...artist,
        momentum: null,
        loading: true,
        error: null
      }))

      setArtists(artistsWithMomentum)

      // Load momentum for each artist (in parallel)
      const momentumPromises = artistsList.map(async (artist, index) => {
        if (!artist.spotify_id) {
          return { index, momentum: null, error: 'No Spotify connection' }
        }

        try {
          const momentum = await momentumApi.getForArtist(artist.id)
          return { index, momentum, error: null }
        } catch (err: any) {
          console.error(`Failed to load momentum for ${artist.name}:`, err)
          return { index, momentum: null, error: err.response?.data?.detail || 'Failed to load' }
        }
      })

      const results = await Promise.all(momentumPromises)

      // Update state with results
      setArtists(prev => {
        const updated = [...prev]
        results.forEach(({ index, momentum, error }) => {
          updated[index] = {
            ...updated[index],
            momentum,
            error,
            loading: false
          }
        })
        return updated
      })

    } catch (err: any) {
      console.error('Failed to load artists:', err)
      setError(err.response?.data?.detail || 'Failed to load artists')
    } finally {
      setLoading(false)
    }
  }

  // Filter artists
  const filteredArtists = artists.filter(artist => {
    if (statusFilter === 'all') return true
    return artist.momentum?.status === statusFilter
  })

  // Sort by momentum score (highest first)
  const sortedArtists = [...filteredArtists].sort((a, b) => {
    const scoreA = a.momentum?.score ?? -1
    const scoreB = b.momentum?.score ?? -1
    return scoreB - scoreA
  })

  // Stats
  const stats = {
    total: artists.filter(a => a.momentum !== null).length,
    fire: artists.filter(a => a.momentum?.status === 'fire').length,
    growing: artists.filter(a => a.momentum?.status === 'growing').length,
    stable: artists.filter(a => a.momentum?.status === 'stable').length,
    declining: artists.filter(a => a.momentum?.status === 'declining').length
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                Momentum Index
              </h1>
              <p className="mt-2 text-gray-600">
                Real-time growth tracking for all your artists
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm font-medium text-gray-500">Tracking</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
                <div className="text-sm font-medium text-red-700">Fire 🔥</div>
                <div className="mt-1 text-2xl font-bold text-red-900">{stats.fire}</div>
              </div>
              <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
                <div className="text-sm font-medium text-green-700">Growing ↗</div>
                <div className="mt-1 text-2xl font-bold text-green-900">{stats.growing}</div>
              </div>
              <div className="bg-blue-50 rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="text-sm font-medium text-blue-700">Stable →</div>
                <div className="mt-1 text-2xl font-bold text-blue-900">{stats.stable}</div>
              </div>
              <div className="bg-orange-50 rounded-lg shadow p-4 border-l-4 border-orange-500">
                <div className="text-sm font-medium text-orange-700">Declining ↘</div>
                <div className="mt-1 text-2xl font-bold text-orange-900">{stats.declining}</div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading momentum data...</span>
            </div>
          )}

          {/* Content */}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Artists List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                    {['all', 'fire', 'growing', 'stable', 'declining'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Artist Cards */}
                {sortedArtists.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No artists match your filter
                    </h3>
                    <p className="text-gray-600">Try adjusting your filter</p>
                  </div>
                ) : (
                  sortedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => setSelectedArtist(artist)}
                      className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg ${
                        selectedArtist?.id === artist.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Image */}
                        {artist.image_url ? (
                          <img
                            src={artist.image_url}
                            alt={artist.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Activity className="w-8 h-8 text-gray-400" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{artist.name}</h3>
                          {artist.loading && (
                            <div className="flex items-center text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-sm">Loading momentum...</span>
                            </div>
                          )}
                          {artist.error && (
                            <p className="text-sm text-orange-600">{artist.error}</p>
                          )}
                          {artist.momentum && (
                            <div className="space-y-2">
                              <MomentumBadge
                                status={artist.momentum.status}
                                score={artist.momentum.score}
                                size="sm"
                              />
                              {artist.momentum.trend_30d !== null && (
                                <p className="text-xs text-gray-600">
                                  30d trend: {artist.momentum.trend_30d > 0 ? '+' : ''}
                                  {artist.momentum.trend_30d.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Detail Panel */}
              <div className="lg:col-span-1">
                {selectedArtist ? (
                  <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {selectedArtist.name}
                    </h3>

                    {selectedArtist.momentum && (
                      <MomentumBreakdown signals={selectedArtist.momentum.signals} />
                    )}

                    <button
                      onClick={() => router.push(`/dashboard/artists/${selectedArtist.id}`)}
                      className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Full Artist Profile
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-12 text-center sticky top-6">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Select an artist to see detailed breakdown
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
