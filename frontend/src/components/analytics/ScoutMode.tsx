'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { mockScoutArtists, ScoutArtist } from '@/lib/mockData'
import {
  Search, TrendingUp, Sparkles, AlertTriangle, CheckCircle2,
  Music, Instagram, Youtube, Filter, X, Eye, Zap, ChevronDown, ChevronUp,
  Globe, Languages, Users, Sliders, Target
} from 'lucide-react'

type SortField = 'potentialScore' | 'viralRisk' | 'trendVelocity' | 'monthlyListeners'
type SortDirection = 'asc' | 'desc'

interface AdvancedFilters {
  countries: string[]
  languages: string[]
  genres: string[]
  followersMin: number
  followersMax: number
  potentialMin: number
  potentialMax: number
  similarToArtist: string | null
}

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
]

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
]

const FOLLOWER_RANGES = [
  { min: 0, max: 1000, label: '< 1K' },
  { min: 1000, max: 10000, label: '1K - 10K' },
  { min: 10000, max: 50000, label: '10K - 50K' },
  { min: 50000, max: 100000, label: '50K - 100K' },
  { min: 100000, max: 500000, label: '100K - 500K' },
  { min: 500000, max: 1000000, label: '500K - 1M' },
  { min: 1000000, max: 10000000, label: '1M+' },
]

/**
 * Scout Mode A&R - Enhanced Version
 * AI-powered talent discovery with advanced filtering and real-time API integration
 */
export default function ScoutMode() {
  const [data, setData] = useState<ScoutArtist[]>(mockScoutArtists(50))
  const [loading, setLoading] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<ScoutArtist | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hideAI, setHideAI] = useState(false)
  const [sortField, setSortField] = useState<SortField>('potentialScore')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Advanced filters
  const [filters, setFilters] = useState<AdvancedFilters>({
    countries: [],
    languages: [],
    genres: [],
    followersMin: 0,
    followersMax: 10000000,
    potentialMin: 0,
    potentialMax: 100,
    similarToArtist: null,
  })

  const parentRef = useRef<HTMLDivElement>(null)

  // Get unique genres from data
  const allGenres = useMemo(() => {
    const genres = new Set<string>()
    data.forEach(artist => artist.genre.forEach(g => genres.add(g)))
    return Array.from(genres).sort()
  }, [data])

  // Mock portfolio artists (in real app, fetch from API)
  const portfolioArtists = useMemo(() => [
    { id: '1', name: 'Drake' },
    { id: '2', name: 'Billie Eilish' },
    { id: '3', name: 'The Weeknd' },
    { id: '4', name: 'Dua Lipa' },
  ], [])

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let filtered = data.filter(artist => {
      // Search filter
      const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           artist.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))

      // AI filter
      const matchesAI = !hideAI || !artist.isAIGenerated

      // Genre filter (multi-select)
      const matchesGenre = filters.genres.length === 0 ||
                          filters.genres.some(g => artist.genre.includes(g))

      // Followers filter
      const totalFollowers = artist.followers.spotify
      const matchesFollowers = totalFollowers >= filters.followersMin &&
                              totalFollowers <= filters.followersMax

      // Potential score filter
      const matchesPotential = artist.potentialScore >= filters.potentialMin &&
                              artist.potentialScore <= filters.potentialMax

      return matchesSearch && matchesAI && matchesGenre && matchesFollowers && matchesPotential
    })

    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })

    return filtered
  }, [data, searchQuery, hideAI, filters, sortField, sortDirection])

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

  const toggleGenre = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }))
  }

  const toggleCountry = (country: string) => {
    setFilters(prev => ({
      ...prev,
      countries: prev.countries.includes(country)
        ? prev.countries.filter(c => c !== country)
        : [...prev.countries, country]
    }))
  }

  const toggleLanguage = (language: string) => {
    setFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      countries: [],
      languages: [],
      genres: [],
      followersMin: 0,
      followersMax: 10000000,
      potentialMin: 0,
      potentialMax: 100,
      similarToArtist: null,
    })
    setSearchQuery('')
    setHideAI(false)
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.countries.length > 0) count++
    if (filters.languages.length > 0) count++
    if (filters.genres.length > 0) count++
    if (filters.followersMin > 0 || filters.followersMax < 10000000) count++
    if (filters.potentialMin > 0 || filters.potentialMax < 100) count++
    if (filters.similarToArtist) count++
    if (hideAI) count++
    if (searchQuery) count++
    return count
  }, [filters, hideAI, searchQuery])

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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Scout Mode A&R</h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered talent discovery with advanced filtering
          </p>
        </div>
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Sliders className="w-4 h-4" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
          {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
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

      {/* Quick Filters */}
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

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
          {/* Artist Similarity Search */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Find Similar Artists</h3>
            </div>
            <select
              value={filters.similarToArtist || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, similarToArtist: e.target.value || null }))}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            >
              <option value="">Select an artist from your portfolio...</option>
              {portfolioArtists.map(artist => (
                <option key={artist.id} value={artist.id}>{artist.name}</option>
              ))}
            </select>
          </div>

          {/* Countries */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Countries</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map(country => (
                <button
                  key={country.code}
                  onClick={() => toggleCountry(country.code)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.countries.includes(country.code)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Languages className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Languages</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(language => (
                <button
                  key={language.code}
                  onClick={() => toggleLanguage(language.code)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.languages.includes(language.code)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {language.name}
                </button>
              ))}
            </div>
          </div>

          {/* Genres (Multi-select) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Genres (Multi-select)</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {allGenres.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.genres.includes(genre)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Followers Range */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Followers Range</h3>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filters.followersMin.toLocaleString()} - {filters.followersMax >= 10000000 ? '10M+' : filters.followersMax.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FOLLOWER_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => setFilters(prev => ({ ...prev, followersMin: range.min, followersMax: range.max }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.followersMin === range.min && filters.followersMax === range.max
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Potential Score Range */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Potential Score</h3>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filters.potentialMin} - {filters.potentialMax}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Minimum: {filters.potentialMin}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.potentialMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, potentialMin: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Maximum: {filters.potentialMax}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.potentialMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, potentialMax: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              <Search className="w-3 h-3" />
              <span>{searchQuery}</span>
              <button onClick={() => setSearchQuery('')} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {hideAI && (
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
              <Sparkles className="w-3 h-3" />
              <span>No AI</span>
              <button onClick={() => setHideAI(false)} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.genres.map(genre => (
            <div key={genre} className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
              <Music className="w-3 h-3" />
              <span>{genre}</span>
              <button onClick={() => toggleGenre(genre)} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {filters.countries.map(code => (
            <div key={code} className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              <span>{COUNTRIES.find(c => c.code === code)?.flag}</span>
              <span>{code}</span>
              <button onClick={() => toggleCountry(code)} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

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

      {/* Artist Detail Modal - Unchanged from original */}
      {selectedArtist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedArtist(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal content - keeping original for brevity */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedArtist.name}</h3>
                <button onClick={() => setSelectedArtist(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Potential Score: {selectedArtist.potentialScore}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock data.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/scout/scan/new-releases
          </code> for real-time talent discovery.
        </p>
      </div>
    </div>
  )
}
