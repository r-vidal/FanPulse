'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import Alert from '@/components/ui/Alert'
import { api } from '@/lib/api'
import { Music, Trash2 } from 'lucide-react'

interface Artist {
  id: string
  name: string
  genre: string | null
  spotify_id: string | null
  instagram_id: string | null
  youtube_id: string | null
  image_url: string | null
  created_at: string
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArtists()
  }, [])

  const fetchArtists = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/artists/')
      setArtists(response.data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch artists:', err)
      setError('Failed to load artists')
    } finally {
      setLoading(false)
    }
  }

  const deleteArtist = async (artistId: string, artistName: string) => {
    if (!confirm(`Are you sure you want to delete ${artistName}? This action cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/api/artists/${artistId}`)
      // Remove artist from state
      setArtists(artists.filter(a => a.id !== artistId))
    } catch (err: any) {
      console.error('Failed to delete artist:', err)
      alert('Failed to delete artist. Please try again.')
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Message */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome to FanPulse! 🎵
            </h2>
            <p className="mt-2 text-gray-600">
              Music analytics platform for managers
            </p>
          </div>

          {/* Email Verification Notice */}
          {user && !user.is_verified && (
            <Alert type="warning" title="Email Not Verified">
              Please check your email to verify your account. Check your spam folder if you don't
              see it.
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Quick Actions */}
          <div className="flex justify-end">
            <a
              href="/dashboard/artists/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un artiste
            </a>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Artists</h3>
              {loading ? (
                <div className="mt-2 animate-pulse">
                  <div className="h-9 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{artists.length}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    {artists.length === 0 ? 'No artists added yet' : `${artists.length} artist${artists.length > 1 ? 's' : ''} tracked`}
                  </p>
                </>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Streams</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">-</p>
              <p className="mt-2 text-sm text-gray-600">Add artists to track streams</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Average Momentum</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">-</p>
              <p className="mt-2 text-sm text-gray-600">Data available after setup</p>
            </div>
          </div>

          {/* Artists List */}
          {!loading && artists.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Artists
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/artists/${artist.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {artist.image_url ? (
                        <img
                          src={artist.image_url}
                          alt={artist.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Music className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{artist.name}</h4>
                        {artist.genre && (
                          <p className="text-sm text-gray-600 truncate">{artist.genre}</p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {artist.spotify_id && (
                            <span className="text-xs text-green-600">Spotify</span>
                          )}
                          {artist.instagram_id && (
                            <span className="text-xs text-pink-600">Instagram</span>
                          )}
                          {artist.youtube_id && (
                            <span className="text-xs text-red-600">YouTube</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteArtist(artist.id, artist.name)
                      }}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete artist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Getting Started */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              🚀 Getting Started
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold mr-3">
                  1
                </span>
                <div>
                  <p className="font-medium text-blue-900">Add your first artist</p>
                  <p className="text-sm text-blue-700">
                    Connect Spotify, Instagram, and other platforms
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold mr-3">
                  2
                </span>
                <div>
                  <p className="font-medium text-blue-900">Configure integrations</p>
                  <p className="text-sm text-blue-700">
                    Set up API keys for data collection
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold mr-3">
                  3
                </span>
                <div>
                  <p className="font-medium text-blue-900">Start analyzing</p>
                  <p className="text-sm text-blue-700">
                    View momentum, superfans, and forecasts
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Coming Soon */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⏳ Coming Soon
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Momentum Index</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time tracking of artist growth trajectories
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Superfan Analysis</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Identify and engage with your top 100 fans
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Revenue Forecasting</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Predict income 3-12 months ahead
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Release Optimizer</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Find the best dates to release music
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
