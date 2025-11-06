'use client'

import { useState, useMemo } from 'react'
import { mockTourPlanning, TourSuggestion } from '@/lib/mockData'
import { MapPin, DollarSign, Users, TrendingUp, Calendar, CheckCircle2, Map } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

/**
 * Tour Planning Intelligence
 * AI-powered tour routing based on fan concentration and market analysis
 * Mock data: GET /api/analytics/{artist_id}/tour-planning
 */
export default function TourPlanningIntelligence({ artistId }: { artistId?: string }) {
  const [data] = useState<TourSuggestion[]>(mockTourPlanning())
  const [sortBy, setSortBy] = useState<'fanConcentration' | 'estimatedRevenue' | 'seasonalScore'>('fanConcentration')
  const [selectedCity, setSelectedCity] = useState<TourSuggestion | null>(null)
  const [minFans, setMinFans] = useState<number>(0)

  // Sort and filter data
  const sortedData = useMemo(() => {
    let filtered = data.filter(city => city.fanConcentration >= minFans)
    return filtered.sort((a, b) => b[sortBy] - a[sortBy])
  }, [data, sortBy, minFans])

  // Top 10 for chart
  const top10 = sortedData.slice(0, 10)

  // Calculate totals
  const totals = {
    totalFans: data.reduce((sum, c) => sum + c.fanConcentration, 0),
    totalRevenue: data.reduce((sum, c) => sum + c.estimatedRevenue, 0),
    avgSeasonalScore: Math.round(data.reduce((sum, c) => sum + c.seasonalScore, 0) / data.length),
    topCities: data.length,
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getSeasonalColor = (score: number) => {
    if (score >= 85) return '#10B981'
    if (score >= 70) return '#3B82F6'
    if (score >= 60) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tour Planning Intelligence</h2>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered tour routing based on fan concentration and market analysis
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cities Analyzed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.topCities}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Fans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(totals.totalFans)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Est. Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">€{formatNumber(totals.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.avgSeasonalScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="fanConcentration">Fan Concentration</option>
              <option value="estimatedRevenue">Estimated Revenue</option>
              <option value="seasonalScore">Seasonal Score</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Minimum Fans: {minFans.toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="20000"
              step="1000"
              value={minFans}
              onChange={(e) => setMinFans(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Top 10 Cities Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Top 10 Cities by Fan Concentration</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis type="category" dataKey="city" tick={{ fill: '#9CA3AF', fontSize: 12 }} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value: number) => [formatNumber(value), 'Fans']}
              />
              <Bar dataKey="fanConcentration" radius={[0, 4, 4, 0]}>
                {top10.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSeasonalColor(entry.seasonalScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Map Placeholder */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fan Concentration Map</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Map className="w-4 h-4" />
            <span>Interactive map coming soon</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-12 border-2 border-dashed border-blue-300 dark:border-blue-700">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Interactive Map Visualization</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl mx-auto">
              Integrate with Mapbox or Google Maps API to display an interactive heatmap showing fan concentration
              across all cities. Features include:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-3xl mx-auto">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">City Markers</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pin all cities with fan data</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Heatmap Overlay</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Visualize fan density</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Optimal Routing</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">AI-suggested tour path</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* City Cards Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recommended Cities ({sortedData.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedData.map((city, i) => (
            <div
              key={i}
              onClick={() => setSelectedCity(city)}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* Rank Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{city.city}</h4>
                    <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded text-xs font-bold text-blue-700 dark:text-blue-300">
                      #{i + 1}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{city.country}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: getSeasonalColor(city.seasonalScore) }}
                >
                  {city.seasonalScore}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fans</p>
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
                    {formatNumber(city.fanConcentration)}
                  </p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Revenue</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-300">
                    €{formatNumber(city.estimatedRevenue)}
                  </p>
                </div>
              </div>

              {/* Venue Capacity */}
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded mb-3">
                <span className="text-xs text-gray-600 dark:text-gray-400">Venue Capacity</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{city.venueCapacity}</span>
              </div>

              {/* Coordinates */}
              <div className="text-xs text-gray-500 dark:text-gray-500">
                📍 {city.lat.toFixed(2)}, {city.lng.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* City Detail Modal */}
      {selectedCity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCity(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedCity.city}, {selectedCity.country}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCity.lat.toFixed(4)}, {selectedCity.lng.toFixed(4)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCity(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fan Concentration</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {formatNumber(selectedCity.fanConcentration)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Est. Revenue</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                    €{selectedCity.estimatedRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Seasonal Score</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {selectedCity.seasonalScore}/100
                  </p>
                </div>
              </div>

              {/* Venue Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Venue Recommendations</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Recommended Capacity</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedCity.venueCapacity} attendees</span>
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Why This City?</h4>
                <ul className="space-y-2">
                  {selectedCity.reasoning.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                Add to Tour Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock data.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/analytics/{'{artist_id}'}/tour-planning
          </code> for real-time tour recommendations.
        </p>
      </div>
    </div>
  )
}
