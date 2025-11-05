'use client'

/**
 * PortfolioSnapshot - Vue overview multi-artistes avec momentum
 * Affiche les 5 premiers artistes avec leur status momentum et metrics clés
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Music, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'

interface Artist {
  id: string
  name: string
  image_url: string | null
  momentum_score: number
  momentum_status: 'fire' | 'growing' | 'stable' | 'declining'
  trend_7d: number | null
  total_streams: number | null | undefined
  total_superfans: number | null | undefined
}

export function PortfolioSnapshot() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArtists()
  }, [])

  const loadArtists = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/artists/')
      // Sort by momentum score and take top 5
      const sorted = response.data
        .sort((a: Artist, b: Artist) => (b.momentum_score || 0) - (a.momentum_score || 0))
        .slice(0, 5)
      setArtists(sorted)
    } catch (error) {
      console.error('Failed to load artists:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMomentumColor = (status: string) => {
    switch (status) {
      case 'fire': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'growing': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'stable': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'declining': return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    }
  }

  const getMomentumTextColor = (status: string) => {
    switch (status) {
      case 'fire': return 'text-red-700 dark:text-red-400'
      case 'growing': return 'text-green-700 dark:text-green-400'
      case 'stable': return 'text-blue-700 dark:text-blue-400'
      case 'declining': return 'text-orange-700 dark:text-orange-400'
      default: return 'text-gray-700 dark:text-gray-400'
    }
  }

  const getMomentumEmoji = (status: string) => {
    switch (status) {
      case 'fire': return '🔥'
      case 'growing': return '📈'
      case 'stable': return '➡️'
      case 'declining': return '📉'
      default: return '⚪'
    }
  }

  const getTrendIcon = (trend: number | null) => {
    if (!trend) return <Minus className="w-4 h-4 text-gray-400" />
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Portfolio Snapshot</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Top {artists.length} artists by momentum</p>
        </div>
        <Link
          href="/dashboard/momentum"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Artists Grid */}
      {artists.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No artists in your portfolio yet</p>
          <Link
            href="/dashboard/artists/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Artist
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {artists.map((artist, index) => (
            <Link
              key={artist.id}
              href={`/dashboard/artists/${artist.id}`}
              className={`block p-4 rounded-lg border-2 transition-all hover:shadow-md ${getMomentumColor(artist.momentum_status)}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center font-bold text-gray-900 dark:text-white">
                  {index + 1}
                </div>

                {/* Artist Image */}
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-14 h-14 rounded-lg object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Music className="w-7 h-7 text-gray-400" />
                  </div>
                )}

                {/* Artist Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{artist.name}</h4>
                    <span className="text-xl">{getMomentumEmoji(artist.momentum_status)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span>{formatNumber(artist.total_streams)} streams</span>
                    <span>•</span>
                    <span>{formatNumber(artist.total_superfans)} superfans</span>
                  </div>
                </div>

                {/* Momentum Score */}
                <div className="flex items-center gap-3">
                  {/* Trend */}
                  {artist.trend_7d !== null && (
                    <div className="text-center">
                      {getTrendIcon(artist.trend_7d)}
                      <div className={`text-xs font-medium ${
                        artist.trend_7d > 0 ? 'text-green-600 dark:text-green-400' :
                        artist.trend_7d < 0 ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {artist.trend_7d > 0 ? '+' : ''}{artist.trend_7d.toFixed(1)}%
                      </div>
                    </div>
                  )}

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getMomentumTextColor(artist.momentum_status)}`}>
                      {artist.momentum_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Momentum</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
