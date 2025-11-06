'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Alert from '@/components/ui/Alert'
import { SkeletonArtistGrid, SkeletonDashboardStats } from '@/components/ui/Skeleton'
import {
  Music, TrendingUp, Heart, Play, Users, ArrowRight,
  Plus, BarChart3, Activity
} from 'lucide-react'
import Link from 'next/link'
import { useArtists } from '@/hooks/useArtists'

export default function ArtistsPage() {
  // Use React Query for automatic caching, refetching, and loading states
  const { data: artists = [], isLoading, error, refetch } = useArtists()

  const formatNumber = (num: number | undefined | null): string => {
    if (num == null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getMomentumColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fire': return 'text-red-600'
      case 'growing': return 'text-green-600'
      case 'stable': return 'text-blue-600'
      case 'declining': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getMomentumBgColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fire': return 'bg-red-50 border-red-200'
      case 'growing': return 'bg-green-50 border-green-200'
      case 'stable': return 'bg-blue-50 border-blue-200'
      case 'declining': return 'bg-orange-50 border-orange-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Artists</h1>
              <p className="text-gray-600">
                Manage and track all your artists in one place
              </p>
            </div>
            <Link
              href="/dashboard/artists/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Artist
            </Link>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert type="error" title="Error">
              {error instanceof Error ? error.message : 'Failed to load artists'}
            </Alert>
          )}

          {/* Loading State with proper skeleton screens */}
          {isLoading ? (
            <>
              <SkeletonDashboardStats />
              <SkeletonArtistGrid count={6} />
            </>
          ) : artists.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-6 bg-gray-100 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">No Artists Yet</h2>
                <p className="text-gray-600 mb-6">
                  Start building your portfolio by adding your first artist. Track their momentum,
                  engage with superfans, and get AI-powered recommendations.
                </p>
                <Link
                  href="/dashboard/artists/add"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Artist
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Total Artists</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{artists.length}</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-purple-50 rounded-lg">
                      <Play className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Total Streams</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(artists.reduce((sum, a) => sum + a.total_streams, 0))}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-pink-50 rounded-lg">
                      <Heart className="w-5 h-5 text-pink-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Total Superfans</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(artists.reduce((sum, a) => sum + a.total_superfans, 0))}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-green-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Avg Momentum</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {(artists.reduce((sum, a) => sum + a.current_momentum, 0) / artists.length).toFixed(1)}
                    <span className="text-xl text-gray-400">/10</span>
                  </p>
                </div>
              </div>

              {/* Artists Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/dashboard/artists/${artist.id}`}
                    className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Artist Image Header */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
                      {artist.image_url ? (
                        <img
                          src={artist.image_url}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-16 h-16 text-white/40" />
                        </div>
                      )}

                      {/* Overlay with momentum status */}
                      <div className="absolute top-4 right-4">
                        <div className={`px-3 py-1.5 rounded-full backdrop-blur-md ${getMomentumBgColor(artist.momentum_status)} border-2`}>
                          <span className={`text-xs font-bold uppercase ${getMomentumColor(artist.momentum_status)}`}>
                            {artist.momentum_status || 'stable'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Artist Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate">
                        {artist.name}
                      </h3>
                      {artist.genre && (
                        <p className="text-sm text-gray-600 mb-4">{artist.genre}</p>
                      )}

                      {/* Stats Grid */}
                      <div className="space-y-3">
                        {/* Momentum Score */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className={`w-4 h-4 ${getMomentumColor(artist.momentum_status)}`} />
                            <span className="text-sm text-gray-600">Momentum</span>
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            {artist.current_momentum?.toFixed(1) || '0.0'}
                            <span className="text-sm text-gray-400">/10</span>
                          </span>
                        </div>

                        {/* Streams */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-gray-600">Streams</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatNumber(artist.total_streams)}
                          </span>
                        </div>

                        {/* Superfans */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-600" />
                            <span className="text-sm text-gray-600">Superfans</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatNumber(artist.total_superfans)}
                          </span>
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-blue-600 group-hover:text-blue-700">
                          <span className="text-sm font-medium">View Details</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Quick Actions */}
          {artists.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick Actions</h2>
                <p className="text-gray-600">Explore more features for your artists</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/momentum"
                  className="group flex items-center gap-4 p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Momentum Index</p>
                    <p className="text-sm text-gray-500">Track growth velocity</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/dashboard/superfans"
                  className="group flex items-center gap-4 p-5 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
                >
                  <div className="p-3 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Superfans</p>
                    <p className="text-sm text-gray-500">Identify top fans</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/dashboard/analytics"
                  className="group flex items-center gap-4 p-5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Analytics</p>
                    <p className="text-sm text-gray-500">Deep dive insights</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
