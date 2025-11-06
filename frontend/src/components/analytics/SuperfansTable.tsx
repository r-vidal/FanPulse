'use client'

import { useState, useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { mockSuperfans, type Superfan } from '@/lib/mockData'
import { Crown, TrendingUp, TrendingDown, MapPin, Calendar, DollarSign, Music, AlertCircle, Mail, Gift } from 'lucide-react'

/**
 * Top 100 Superfans Table
 * Virtual scrolling for performance with 100+ superfans
 * Individual profiles with engagement history and recommended actions
 *
 * Mock data until backend API: GET /api/analytics/{artist_id}/superfans/list
 */

type SortField = 'fvsScore' | 'totalStreams' | 'totalSpent' | 'churnRisk' | 'name'
type SortOrder = 'asc' | 'desc'

export default function SuperfansTable({ artistId }: { artistId?: string }) {
  // TODO: Replace with real API call when ready
  const [superfans] = useState(mockSuperfans(100))
  const [sortField, setSortField] = useState<SortField>('fvsScore')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedFan, setSelectedFan] = useState<Superfan | null>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  // Sort superfans
  const sortedSuperfans = useMemo(() => {
    return [...superfans].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (typeof aValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue)
      }

      return sortOrder === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })
  }, [superfans, sortField, sortOrder])

  // Virtual scrolling configuration
  const rowVirtualizer = useVirtualizer({
    count: sortedSuperfans.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getEngagementBadge = (level: Superfan['engagementLevel']) => {
    const config = {
      platinum: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Platinum' },
      gold: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Gold' },
      silver: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Silver' },
      bronze: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'Bronze' },
    }
    return config[level]
  }

  const getChurnRiskColor = (risk: number) => {
    if (risk >= 60) return 'text-red-600 dark:text-red-400'
    if (risk >= 30) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Top 100 Superfans</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Individual profiles with actionable engagement history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
              {sortedSuperfans.length} Superfans
            </span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Platinum</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {sortedSuperfans.filter(f => f.engagementLevel === 'platinum').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            €{sortedSuperfans.reduce((sum, f) => sum + f.totalSpent, 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Music className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Streams</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {(sortedSuperfans.reduce((sum, f) => sum + f.totalStreams, 0) / 1000).toFixed(0)}K
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">High Churn Risk</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {sortedSuperfans.filter(f => f.churnRisk >= 60).length}
          </p>
        </div>
      </div>

      {/* Virtualized Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Table Header - Fixed */}
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
            <div className="col-span-1 text-center">#</div>
            <button
              onClick={() => handleSort('name')}
              className="col-span-3 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
            >
              Superfan
              {sortField === 'name' && (sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
            </button>
            <button
              onClick={() => handleSort('fvsScore')}
              className="col-span-2 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              FVS Score
              {sortField === 'fvsScore' && (sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
            </button>
            <button
              onClick={() => handleSort('totalStreams')}
              className="col-span-2 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Streams
              {sortField === 'totalStreams' && (sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
            </button>
            <button
              onClick={() => handleSort('totalSpent')}
              className="col-span-2 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Spent
              {sortField === 'totalSpent' && (sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
            </button>
            <button
              onClick={() => handleSort('churnRisk')}
              className="col-span-2 flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Churn Risk
              {sortField === 'churnRisk' && (sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
            </button>
          </div>
        </div>

        {/* Virtualized Rows */}
        <div ref={parentRef} className="h-[600px] overflow-auto">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const fan = sortedSuperfans[virtualRow.index]
              const badge = getEngagementBadge(fan.engagementLevel)

              return (
                <div
                  key={fan.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <button
                    onClick={() => setSelectedFan(fan)}
                    className="w-full grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 items-center text-left"
                  >
                    {/* Rank */}
                    <div className="col-span-1 text-center">
                      <span className="text-lg font-bold text-gray-400 dark:text-gray-600">
                        #{virtualRow.index + 1}
                      </span>
                    </div>

                    {/* Name & Badge */}
                    <div className="col-span-3">
                      <p className="font-medium text-gray-900 dark:text-white">{fan.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {fan.location.city}
                        </span>
                      </div>
                    </div>

                    {/* FVS Score */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{fan.fvsScore}</span>
                        <span className="text-sm text-gray-400 dark:text-gray-600">/100</span>
                      </div>
                    </div>

                    {/* Streams */}
                    <div className="col-span-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {fan.totalStreams.toLocaleString()}
                      </span>
                    </div>

                    {/* Spent */}
                    <div className="col-span-2">
                      <span className="font-medium text-green-600 dark:text-green-400">
                        €{fan.totalSpent}
                      </span>
                    </div>

                    {/* Churn Risk */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getChurnRiskColor(fan.churnRisk)}`}>
                          {fan.churnRisk}%
                        </span>
                        {fan.churnRisk >= 60 && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      </div>
                    </div>
                  </button>
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
              sortedSuperfans.length
            )}{' '}
            of {sortedSuperfans.length} superfans
          </p>
        </div>
      </div>

      {/* Selected Fan Detail Modal */}
      {selectedFan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedFan(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedFan.name}</h3>
                <div className="flex items-center gap-3">
                  {(() => {
                    const badge = getEngagementBadge(selectedFan.engagementLevel)
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                        <Crown className="w-4 h-4 inline mr-1" />
                        {badge.label}
                      </span>
                    )
                  })()}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {selectedFan.location.city}, {selectedFan.location.country}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFan(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">FVS Score</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">{selectedFan.fvsScore}/100</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Total Streams</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">{selectedFan.totalStreams.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-300">€{selectedFan.totalSpent}</p>
              </div>
              <div className={`rounded-lg p-4 ${selectedFan.churnRisk >= 60 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                <p className={`text-sm mb-1 ${selectedFan.churnRisk >= 60 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>Churn Risk</p>
                <p className={`text-3xl font-bold ${selectedFan.churnRisk >= 60 ? 'text-red-900 dark:text-red-300' : 'text-green-900 dark:text-green-300'}`}>{selectedFan.churnRisk}%</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Activity Timeline</h4>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    First Seen
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedFan.firstSeen).toLocaleDateString()}</p>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                </div>
                <div className="text-right">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Last Active
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedFan.lastActive).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Active Platforms</h4>
              <div className="flex flex-wrap gap-2">
                {selectedFan.platforms.map((platform) => (
                  <span key={platform} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Top Tracks */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Top Tracks</h4>
              <div className="space-y-2">
                {selectedFan.topTracks.map((track, index) => (
                  <div key={track} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-600">#{index + 1}</span>
                    <Music className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{track}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Recommended Actions</h4>
              <div className="space-y-2">
                {selectedFan.recommendedActions.map((action, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-left"
                  >
                    {index === 0 ? <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">{action}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock data.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/analytics/{'{artist_id}'}/superfans/list
          </code> for real-time data.
        </p>
      </div>
    </div>
  )
}
