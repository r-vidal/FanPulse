'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ArrowLeft, Music, ExternalLink, TrendingUp, Users, Calendar } from 'lucide-react'
import Alert from '@/components/ui/Alert'

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

export default function ArtistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchArtist(params.id as string)
    }
  }, [params.id])

  const fetchArtist = async (artistId: string) => {
    try {
      setLoading(true)
      const response = await api.get(`/api/artists/${artistId}`)
      setArtist(response.data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch artist:', err)
      setError('Failed to load artist details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !artist) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <Alert type="error" title="Error">
              {error || 'Artist not found'}
            </Alert>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          {/* Artist Header */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Artist Image */}
              <div className="flex-shrink-0">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-48 h-48 rounded-lg object-cover shadow-md"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Music className="w-24 h-24 text-white" />
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{artist.name}</h1>
                {artist.genre && (
                  <p className="text-lg text-gray-600 mb-4 capitalize">{artist.genre}</p>
                )}

                {/* Platform Connections */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {artist.spotify_id && (
                    <a
                      href={`https://open.spotify.com/artist/${artist.spotify_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Spotify
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  )}
                  {artist.instagram_id && (
                    <a
                      href={`https://instagram.com/${artist.instagram_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      Instagram
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  )}
                  {artist.youtube_id && (
                    <a
                      href={`https://youtube.com/channel/${artist.youtube_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      YouTube
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  )}
                </div>

                {/* Added Date */}
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  Added on {new Date(artist.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Total Streams</h3>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">-</p>
              <p className="text-sm text-gray-600 mt-2">Connect Spotify to track</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Monthly Listeners</h3>
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">-</p>
              <p className="text-sm text-gray-600 mt-2">Connect Spotify to track</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Momentum Score</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">-</p>
              <p className="text-sm text-gray-600 mt-2">Data available soon</p>
            </div>
          </div>

          {/* Streaming Data Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Streaming Analytics</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Connect Spotify for Detailed Analytics
                </h3>
                <p className="text-blue-700 mb-4">
                  Authorize Spotify access to view streaming data, monthly listeners, and growth metrics
                </p>
              </div>
              <button className="px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors inline-flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Connect Spotify Account
              </button>
              <p className="text-xs text-gray-600 mt-3">
                This will allow FanPulse to access your artist's streaming statistics
              </p>
            </div>
          </div>

          {/* Recent Activity Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-center py-8 text-gray-500">
              <Music className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No activity data available yet</p>
              <p className="text-sm mt-1">Connect platforms to start tracking activity</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
