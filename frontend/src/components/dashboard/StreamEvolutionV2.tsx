'use client'

/**
 * StreamEvolutionV2 - Graph streams 30 derniers jours
 * Line chart streams agrégés tous artistes avec breakdown par source
 */

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Play, Calendar } from 'lucide-react'
import { streamsApi, StreamDataPoint, StreamStats } from '@/lib/api/streams'

export function StreamEvolutionV2() {
  const [data, setData] = useState<StreamDataPoint[]>([])
  const [stats, setStats] = useState<StreamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadStreamData()
  }, [timeRange])

  const loadStreamData = async () => {
    try {
      setLoading(true)

      // Fetch data from API
      const response = await streamsApi.getEvolution(timeRange)

      setData(response.data)
      setStats(response.stats)
    } catch (error) {
      console.error('Failed to load stream data:', error)
      // Set empty data on error
      setData([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload) return null

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {payload[0]?.payload.date}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-600 dark:text-gray-400">Total:</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatNumber(payload[0]?.value)}
            </span>
          </div>
          {payload.slice(1).map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">{entry.name}:</span>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Play className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Stream Evolution</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Streaming performance across all platforms
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`
                px-3 py-1 rounded-md text-sm font-medium transition-colors
                ${timeRange === range
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">
              Total Streams
            </div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {formatNumber(stats.total_30d)}
            </div>
          </div>

          <div className={`rounded-lg p-3 border ${
            stats.change_30d >= 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className={`text-xs font-medium mb-1 ${
              stats.change_30d >= 0
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}>
              Growth
            </div>
            <div className={`text-lg font-bold flex items-center gap-1 ${
              stats.change_30d >= 0
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              <TrendingUp className={`w-4 h-4 ${stats.change_30d < 0 ? 'rotate-180' : ''}`} />
              {stats.change_30d > 0 ? '+' : ''}{stats.change_30d.toFixed(1)}%
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
              Daily Average
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {formatNumber(stats.average_daily)}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
              Peak Day
            </div>
            <div className="text-xs font-bold text-yellow-900 dark:text-yellow-100">
              {stats.peak_day}
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-400">
              {formatNumber(stats.peak_streams)}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="spotify"
              name="Spotify"
              stroke="#1db954"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="appleMusic"
              name="Apple Music"
              stroke="#fa243c"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="youtube"
              name="YouTube"
              stroke="#ff0000"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
