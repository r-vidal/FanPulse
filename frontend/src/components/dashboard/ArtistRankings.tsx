'use client'

/**
 * ArtistRankings - Classement artistes par momentum avec médailles
 * Affiche le Top 5 artistes avec photos, scores et trends
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Music, Award, TrendingUp, TrendingDown, Minus, Crown } from 'lucide-react'
import { api } from '@/lib/api'

interface RankedArtist {
  id: string
  name: string
  image_url: string | null
  momentum_score: number
  momentum_status: 'fire' | 'growing' | 'stable' | 'declining'
  trend_7d: number | null
  trend_30d: number | null
}

export function ArtistRankings() {
  const [artists, setArtists] = useState<RankedArtist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRankings()
  }, [])

  const loadRankings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/artists/')

      // Sort by momentum score and take top 5
      const ranked = response.data
        .filter((a: any) => a.momentum_score != null)
        .sort((a: any, b: any) => b.momentum_score - a.momentum_score)
        .slice(0, 5)

      setArtists(ranked)
    } catch (error) {
      console.error('Failed to load artist rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900">
              1
            </div>
          </div>
        )
      case 2:
        return (
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 flex items-center justify-center shadow-md">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900">
              2
            </div>
          </div>
        )
      case 3:
        return (
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900">
              3
            </div>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300">
            {rank}
          </div>
        )
    }
  }

  const getMomentumColor = (status: string) => {
    switch (status) {
      case 'fire': return 'text-red-600 dark:text-red-400'
      case 'growing': return 'text-green-600 dark:text-green-400'
      case 'stable': return 'text-blue-600 dark:text-blue-400'
      case 'declining': return 'text-orange-600 dark:text-orange-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getTrendIcon = (trend: number | null) => {
    if (!trend) return <Minus className="w-4 h-4 text-gray-400" />
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Artist Rankings</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Top performers by momentum score</p>
      </div>

      {/* Rankings List */}
      {artists.length === 0 ? (
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">No rankings available yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {artists.map((artist, index) => {
            const rank = index + 1
            const isTopThree = rank <= 3

            return (
              <Link
                key={artist.id}
                href={`/dashboard/artists/${artist.id}`}
                className={`
                  block p-4 rounded-xl transition-all hover:shadow-md
                  ${isTopThree
                    ? 'bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    {getRankBadge(rank)}
                  </div>

                  {/* Artist Image */}
                  <div className="flex-shrink-0">
                    {artist.image_url ? (
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className={`rounded-lg object-cover shadow-md ${
                          rank === 1 ? 'w-16 h-16' : rank === 2 ? 'w-14 h-14' : 'w-12 h-12'
                        }`}
                      />
                    ) : (
                      <div className={`rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${
                        rank === 1 ? 'w-16 h-16' : rank === 2 ? 'w-14 h-14' : 'w-12 h-12'
                      }`}>
                        <Music className={`text-gray-400 ${
                          rank === 1 ? 'w-8 h-8' : rank === 2 ? 'w-7 h-7' : 'w-6 h-6'
                        }`} />
                      </div>
                    )}
                  </div>

                  {/* Artist Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-gray-900 dark:text-white truncate ${
                      rank === 1 ? 'text-lg' : 'text-base'
                    }`}>
                      {artist.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-medium uppercase ${getMomentumColor(artist.momentum_status)}`}>
                        {artist.momentum_status}
                      </span>
                      {artist.trend_7d !== null && (
                        <div className="flex items-center gap-1 text-xs">
                          {getTrendIcon(artist.trend_7d)}
                          <span className={
                            artist.trend_7d > 0 ? 'text-green-600 dark:text-green-400' :
                            artist.trend_7d < 0 ? 'text-red-600 dark:text-red-400' :
                            'text-gray-600 dark:text-gray-400'
                          }>
                            {artist.trend_7d > 0 ? '+' : ''}{artist.trend_7d.toFixed(1)}% (7d)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Momentum Score */}
                  <div className="text-right">
                    <div className={`font-bold ${getMomentumColor(artist.momentum_status)} ${
                      rank === 1 ? 'text-3xl' : rank === 2 ? 'text-2xl' : 'text-xl'
                    }`}>
                      {artist.momentum_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">/ 10</div>
                  </div>
                </div>

                {/* 30-day trend bar (only for top 3) */}
                {isTopThree && artist.trend_30d !== null && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>30-day momentum</span>
                      <span className={
                        artist.trend_30d > 0 ? 'text-green-600 dark:text-green-400 font-medium' :
                        artist.trend_30d < 0 ? 'text-red-600 dark:text-red-400 font-medium' :
                        ''
                      }>
                        {artist.trend_30d > 0 ? '+' : ''}{artist.trend_30d.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          artist.trend_30d > 0 ? 'bg-green-500' :
                          artist.trend_30d < 0 ? 'bg-red-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(Math.abs(artist.trend_30d), 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
