'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Alert from '@/components/ui/Alert'
import { artistsApi, Artist } from '@/lib/api/artists'
import { Music, Plus, TrendingUp, Users, Play, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ArtistsPage() {
  const router = useRouter()
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArtists()
  }, [])

  const fetchArtists = async () => {
    try {
      setLoading(true)
      const data = await artistsApi.getAll()
      setArtists(data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch artists:', err)
      setError('Failed to load artists')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (artistId: string) => {
    if (!confirm('Are you sure you want to delete this artist?')) return

    try {
      await artistsApi.delete(artistId)
      setArtists(artists.filter(a => a.id !== artistId))
    } catch (err: any) {
      alert('Failed to delete artist: ' + err.message)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Artists</h1>
              <p className="text-gray-600 mt-1">
                Manage your artist roster and track their performance
              </p>
            </div>
            <Link
              href="/dashboard/artists/add"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Artist
            </Link>
          </div>

          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : artists.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <Music className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No artists yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first artist to track their momentum and growth
              </p>
              <Link
                href="/dashboard/artists/add"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Artist
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
                >
                  {/* Artist Header */}
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {artist.image_url ? (
                        <img
                          src={artist.image_url}
                          alt={artist.name}
                          className="w-20 h-20 rounded-lg object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                          <Music className="w-10 h-10 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {artist.name}
                        </h3>
                        {artist.genre && (
                          <p className="text-sm text-gray-600">{artist.genre}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {artist.spotify_id && (
                            <a
                              href={`https://open.spotify.com/artist/${artist.spotify_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700"
                              title="View on Spotify"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-900">Momentum</span>
                        </div>
                        <p className="text-lg font-bold text-blue-900">--</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-900">Superfans</span>
                        </div>
                        <p className="text-lg font-bold text-purple-900">--</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/artists/${artist.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        View Details
                      </Link>
                      <button
                        onClick={() => handleDelete(artist.id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
