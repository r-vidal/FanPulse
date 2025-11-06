'use client'

import { useState, useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { mockScoutArtists, ScoutArtist } from '@/lib/mockData'
import {
  Search, TrendingUp, Sparkles, AlertTriangle, CheckCircle2,
  Music, Instagram, Youtube, Filter, X, Eye, Zap
} from 'lucide-react'

type SortField = 'potentialScore' | 'viralRisk' | 'trendVelocity' | 'monthlyListeners'
type SortDirection = 'asc' | 'desc'

/**
 * Scout Mode A&R
 * AI-powered talent discovery with authenticity detection
 * Mock data: GET /api/scout/discover
 */
export default function ScoutMode() {
  const [data] = useState<ScoutArtist[]>(mockScoutArtists(50))
  const [selectedArtist, setSelectedArtist] = useState<ScoutArtist | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState<string>('all')
  const [hideAI, setHideAI] = useState(false)
  const [sortField, setSortField] = useState<SortField>('potentialScore')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const parentRef = useRef<HTMLDivElement>(null)

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let filtered = data.filter(artist => {
      const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           artist.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesGenre = genreFilter === 'all' || artist.genre.includes(genreFilter)
      const matchesAI = !hideAI || !artist.isAIGenerated
      return matchesSearch && matchesGenre && matchesAI
    })

    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })

    return filtered
  }, [data, searchQuery, genreFilter, hideAI, sortField, sortDirection])

  // Get unique genres
  const allGenres = useMemo(() => {
    const genres = new Set<string>()
    data.forEach(artist => artist.genre.forEach(g => genres.add(g)))
    return Array.from(genres).sort()
  }, [data])

  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getAuthenticityColor = (prob: number) => {
    if (prob > 0.7) return 'text-red-600 dark:text-red-400'
    if (prob > 0.4) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getPotentialColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400'
    if (score >= 70) return 'text-blue-600 dark:text-blue-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const aiCount = data.filter(a => a.isAIGenerated).length
  const authenticCount = data.length - aiCount
  const highPotentialCount = filteredAndSorted.filter(a => a.potentialScore >= 85).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Scout Mode A&R</h2>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered talent discovery with authenticity detection
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Music className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Artists</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAndSorted.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Authentic</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{authenticCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI Detected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{aiCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Potential</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{highPotentialCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search artists or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          {/* Genre Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
            >
              <option value="all">All Genres</option>
              {allGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Hide AI Toggle */}
          <button
            onClick={() => setHideAI(!hideAI)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hideAI
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Hide AI
          </button>
        </div>
      </div>

      {/* Artists Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
          <div className="col-span-3">Artist</div>
          <div className="col-span-2">Genres</div>
          <div
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white"
            onClick={() => handleSort('potentialScore')}
          >
            Potential
            {sortField === 'potentialScore' && (
              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white"
            onClick={() => handleSort('viralRisk')}
          >
            Viral Risk
            {sortField === 'viralRisk' && (
              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white"
            onClick={() => handleSort('trendVelocity')}
          >
            Velocity
            {sortField === 'trendVelocity' && (
              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className="col-span-1 text-center">Details</div>
        </div>

        {/* Virtual List */}
        <div ref={parentRef} className="h-[600px] overflow-auto">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const artist = filteredAndSorted[virtualRow.index]
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Artist Name + AI Badge */}
                  <div className="col-span-3 flex items-center gap-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{artist.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {artist.monthlyListeners.toLocaleString()} listeners
                      </p>
                    </div>
                    {artist.isAIGenerated && (
                      <div className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs font-semibold text-red-700 dark:text-red-400">
                        AI
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {artist.genre.slice(0, 2).map((genre, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300">
                        {genre}
                      </span>
                    ))}
                  </div>

                  {/* Potential Score */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${getPotentialColor(artist.potentialScore)}`}>
                          {artist.potentialScore}
                        </span>
                        <span className="text-xs text-gray-400">/100</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            artist.potentialScore >= 85 ? 'bg-green-500' :
                            artist.potentialScore >= 70 ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${artist.potentialScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Viral Risk */}
                  <div className="col-span-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {artist.viralRisk}%
                    </span>
                  </div>

                  {/* Trend Velocity */}
                  <div className="col-span-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      +{artist.trendVelocity}%
                    </span>
                  </div>

                  {/* View Details */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => setSelectedArtist(artist)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`View details for ${artist.name}`}
                    >
                      <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Artist Detail Modal */}
      {selectedArtist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedArtist(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedArtist.name}</h3>
                    {selectedArtist.isAIGenerated && (
                      <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm font-semibold text-red-700 dark:text-red-400">
                        AI Generated
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArtist.genre.map((genre, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-sm text-blue-700 dark:text-blue-300">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArtist(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Potential Score</p>
                  <p className={`text-4xl font-bold ${getPotentialColor(selectedArtist.potentialScore)}`}>
                    {selectedArtist.potentialScore}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">/100</p>
                </div>

                <div className={`border rounded-xl p-4 ${
                  selectedArtist.aiProbability > 0.7
                    ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">AI Probability</p>
                  <p className={`text-4xl font-bold ${getAuthenticityColor(selectedArtist.aiProbability)}`}>
                    {Math.round(selectedArtist.aiProbability * 100)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {selectedArtist.aiProbability > 0.7 ? 'High risk' : selectedArtist.aiProbability > 0.4 ? 'Medium' : 'Authentic'}
                  </p>
                </div>
              </div>

              {/* Social Stats */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Social Presence</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Music className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Spotify</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {(selectedArtist.followers.spotify / 1000).toFixed(1)}K
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Instagram</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {(selectedArtist.followers.instagram / 1000).toFixed(1)}K
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">TikTok</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {(selectedArtist.followers.tiktok / 1000).toFixed(1)}K
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Analysis */}
              {selectedArtist.audioAnalysis && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Audio Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Production Quality</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-blue-500"
                            style={{ width: `${selectedArtist.audioAnalysis.productionQuality}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {selectedArtist.audioAnalysis.productionQuality}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">Genre Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedArtist.audioAnalysis.genreTags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-700 dark:text-purple-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedArtist.audioAnalysis.aiMarkers.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-2">AI Markers Detected</p>
                        <ul className="space-y-1">
                          {selectedArtist.audioAnalysis.aiMarkers.map((marker, i) => (
                            <li key={i} className="text-xs text-red-700 dark:text-red-300">• {marker}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reasoning */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Why This Artist?</h4>
                <ul className="space-y-2">
                  {selectedArtist.reasoning.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Engagement Rate</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedArtist.engagementRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Trend Velocity</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">+{selectedArtist.trendVelocity}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Discovered</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Date(selectedArtist.discoveredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
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
            GET /api/scout/discover
          </code> for real-time talent discovery.
        </p>
      </div>
    </div>
  )
}
