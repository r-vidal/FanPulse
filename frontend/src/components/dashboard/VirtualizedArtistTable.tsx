'use client'

import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useArtists, Artist } from '@/hooks/useArtists'
import { Music, TrendingUp, TrendingDown, Play, Heart, Activity, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type SortField = 'name' | 'momentum' | 'streams' | 'superfans' | 'trend'
type SortOrder = 'asc' | 'desc'

export default function VirtualizedArtistTable() {
  const { data: artists = [], isLoading } = useArtists()
  const parentRef = useRef<HTMLDivElement>(null)
  const [sortField, setSortField] = useState<SortField>('momentum')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Sort artists
  const sortedArtists = useMemo(() => {
    const sorted = [...artists].sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'momentum':
          aValue = a.current_momentum || 0
          bValue = b.current_momentum || 0
          break
        case 'streams':
          aValue = a.total_streams || 0
          bValue = b.total_streams || 0
          break
        case 'superfans':
          aValue = a.total_superfans || 0
          bValue = b.total_superfans || 0
          break
        case 'trend':
          aValue = a.trend_7d || 0
          bValue = b.trend_7d || 0
          break
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })

    return sorted
  }, [artists, sortField, sortOrder])

  // Virtual scrolling configuration
  const rowVirtualizer = useVirtualizer({
    count: sortedArtists.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
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
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'growing':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'stable':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'declining':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortOrder === 'asc' ? (
      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header with stats */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Artists</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sortedArtists.length} artist{sortedArtists.length !== 1 ? 's' : ''} total
            </p>
          </div>
          {sortedArtists.length > 10 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Virtual scrolling enabled</span> - optimized for {sortedArtists.length}+ rows
            </div>
          )}
        </div>
      </div>

      {/* Table Header - Fixed */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
          <button
            onClick={() => handleSort('name')}
            className="col-span-3 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
          >
            Artist
            <SortIcon field="name" />
          </button>

          <button
            onClick={() => handleSort('momentum')}
            className="col-span-2 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Momentum
            <SortIcon field="momentum" />
          </button>

          <button
            onClick={() => handleSort('streams')}
            className="col-span-2 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Streams
            <SortIcon field="streams" />
          </button>

          <button
            onClick={() => handleSort('superfans')}
            className="col-span-2 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Superfans
            <SortIcon field="superfans" />
          </button>

          <button
            onClick={() => handleSort('trend')}
            className="col-span-2 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            7d Trend
            <SortIcon field="trend" />
          </button>

          <div className="col-span-1 text-right">Actions</div>
        </div>
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
        style={{
          // Ensure smooth scrolling on iOS
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const artist = sortedArtists[virtualRow.index]
            if (!artist) return null

            return (
              <div
                key={artist.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Link
                  href={`/dashboard/artists/${artist.id}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 items-center"
                >
                  {/* Artist Name & Image */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {artist.image_url ? (
                        <img
                          src={artist.image_url}
                          alt={artist.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{artist.name}</p>
                      {artist.genre && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{artist.genre}</p>
                      )}
                    </div>
                  </div>

                  {/* Momentum */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {artist.current_momentum?.toFixed(1) || '0.0'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getMomentumColor(
                          artist.momentum_status
                        )}`}
                      >
                        {artist.momentum_status || 'stable'}
                      </span>
                    </div>
                  </div>

                  {/* Streams */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(artist.total_streams)}
                      </span>
                    </div>
                  </div>

                  {/* Superfans */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(artist.total_superfans)}
                      </span>
                    </div>
                  </div>

                  {/* 7d Trend */}
                  <div className="col-span-2">
                    {artist.trend_7d !== undefined && artist.trend_7d !== null ? (
                      <div className="flex items-center gap-1.5">
                        {artist.trend_7d >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                        <span
                          className={`font-medium ${
                            artist.trend_7d >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {artist.trend_7d >= 0 ? '+' : ''}
                          {artist.trend_7d.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-right">
                    <span className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                      View →
                    </span>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Showing {rowVirtualizer.getVirtualItems()[0]?.index + 1 || 0} to{' '}
          {Math.min(
            (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.index || 0) + 1,
            sortedArtists.length
          )}{' '}
          of {sortedArtists.length} artists • Virtual scrolling optimized for performance
        </p>
      </div>
    </div>
  )
}
