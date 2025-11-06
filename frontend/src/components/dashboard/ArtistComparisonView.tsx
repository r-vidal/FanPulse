'use client'

import { useState, useMemo } from 'react'
import { useArtists, Artist } from '@/hooks/useArtists'
import { X, TrendingUp, TrendingDown, Music, Play, Heart, Activity, AlertCircle } from 'lucide-react'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface Props {
  initialArtistIds?: string[]
  maxArtists?: number
}

export default function ArtistComparisonView({ initialArtistIds = [], maxArtists = 3 }: Props) {
  const { data: allArtists = [], isLoading } = useArtists()
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>(initialArtistIds.slice(0, maxArtists))

  // Get selected artists with full data
  const selectedArtists = useMemo(() => {
    return selectedArtistIds
      .map((id) => allArtists.find((a) => a.id === id))
      .filter((a): a is Artist => a !== undefined)
  }, [selectedArtistIds, allArtists])

  // Available artists to add
  const availableArtists = useMemo(() => {
    return allArtists.filter((a) => !selectedArtistIds.includes(a.id))
  }, [allArtists, selectedArtistIds])

  const handleAddArtist = (artistId: string) => {
    if (selectedArtistIds.length < maxArtists) {
      setSelectedArtistIds([...selectedArtistIds, artistId])
    }
  }

  const handleRemoveArtist = (artistId: string) => {
    setSelectedArtistIds(selectedArtistIds.filter((id) => id !== artistId))
  }

  const formatNumber = (num: number | undefined | null): string => {
    if (num == null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getMomentumColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fire':
        return 'text-red-600 dark:text-red-400'
      case 'growing':
        return 'text-green-600 dark:text-green-400'
      case 'stable':
        return 'text-blue-600 dark:text-blue-400'
      case 'declining':
        return 'text-orange-600 dark:text-orange-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getMomentumIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fire':
      case 'growing':
        return TrendingUp
      case 'declining':
        return TrendingDown
      default:
        return Activity
    }
  }

  // Calculate comparison insights
  const comparisonInsights = useMemo(() => {
    if (selectedArtists.length < 2) return null

    const highestMomentum = selectedArtists.reduce((max, a) => (a.current_momentum > max.current_momentum ? a : max))
    const highestStreams = selectedArtists.reduce((max, a) => (a.total_streams > max.total_streams ? a : max))
    const highestSuperfans = selectedArtists.reduce((max, a) => (a.total_superfans > max.total_superfans ? a : max))

    return {
      highestMomentum,
      highestStreams,
      highestSuperfans,
    }
  }, [selectedArtists])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Artist Comparison</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Compare up to {maxArtists} artists side-by-side
          </p>
        </div>

        {selectedArtists.length < maxArtists && availableArtists.length > 0 && (
          <select
            onChange={(e) => e.target.value && handleAddArtist(e.target.value)}
            value=""
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">+ Add Artist to Compare</option>
            {availableArtists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Empty State */}
      {selectedArtists.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Activity className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Artists Selected</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select at least 2 artists to start comparing their performance metrics side-by-side.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      {selectedArtists.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedArtists.map((artist) => {
              const MomentumIcon = getMomentumIcon(artist.momentum_status)
              const isHighestMomentum = comparisonInsights?.highestMomentum.id === artist.id
              const isHighestStreams = comparisonInsights?.highestStreams.id === artist.id
              const isHighestSuperfans = comparisonInsights?.highestSuperfans.id === artist.id

              return (
                <div
                  key={artist.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Artist Header */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-12 h-12 text-white/40" />
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveArtist(artist.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-colors"
                      aria-label="Remove artist"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Artist Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{artist.name}</h3>
                    {artist.genre && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{artist.genre}</p>}

                    {/* Metrics Grid */}
                    <div className="space-y-4">
                      {/* Momentum Score */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <MomentumIcon className={`w-4 h-4 ${getMomentumColor(artist.momentum_status)}`} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Momentum</span>
                          </div>
                          {isHighestMomentum && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                              Highest
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {artist.current_momentum?.toFixed(1)}
                          <span className="text-sm text-gray-400 dark:text-gray-600">/10</span>
                        </div>
                        <div
                          className={`mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}
                        >
                          <div
                            className={`h-full ${getMomentumColor(artist.momentum_status).replace(
                              'text-',
                              'bg-'
                            )} transition-all duration-500`}
                            style={{ width: `${(artist.current_momentum / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Total Streams */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Streams</span>
                          </div>
                          {isHighestStreams && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full">
                              Highest
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(artist.total_streams)}
                        </div>
                      </div>

                      {/* Superfans */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Superfans</span>
                          </div>
                          {isHighestSuperfans && (
                            <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-xs font-medium rounded-full">
                              Highest
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(artist.total_superfans)}
                        </div>
                      </div>

                      {/* Trend Indicator */}
                      {artist.trend_7d !== undefined && artist.trend_7d !== null && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            {artist.trend_7d >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                artist.trend_7d >= 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {artist.trend_7d >= 0 ? '+' : ''}
                              {artist.trend_7d.toFixed(1)}% (7d)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparison Insights */}
          {selectedArtists.length >= 2 && comparisonInsights && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">Comparison Insights</h4>
                  <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                    <li>
                      <strong>{comparisonInsights.highestMomentum.name}</strong> has the highest momentum score (
                      {comparisonInsights.highestMomentum.current_momentum.toFixed(1)}/10)
                    </li>
                    <li>
                      <strong>{comparisonInsights.highestStreams.name}</strong> leads in total streams (
                      {formatNumber(comparisonInsights.highestStreams.total_streams)})
                    </li>
                    <li>
                      <strong>{comparisonInsights.highestSuperfans.name}</strong> has the most superfans (
                      {formatNumber(comparisonInsights.highestSuperfans.total_superfans)})
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
