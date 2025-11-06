'use client'

import { useState } from 'react'
import { mockFVSData } from '@/lib/mockData'
import { useArtistContext } from '@/contexts/ArtistContext'
import AnalyticsPageHeader from '@/components/ui/AnalyticsPageHeader'
import { TrendingUp, TrendingDown, Music, Heart, DollarSign, Users, Zap, Info } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

/**
 * Fan Value Score (FVS) Dashboard
 * Displays comprehensive 0-100 score identifying monetizable superfans
 *
 * Mock data until backend API: GET /api/analytics/{artist_id}/fvs
 */
export default function FVSDashboard({ artistId: propArtistId }: { artistId?: string }) {
  const { selectedArtist } = useArtistContext()
  const artistId = propArtistId || selectedArtist?.id

  // TODO: Replace with real API call when ready - will use artistId parameter
  const [data] = useState(mockFVSData())

  const scoreColor = data.score >= 80 ? 'text-green-600 dark:text-green-400' :
                     data.score >= 60 ? 'text-blue-600 dark:text-blue-400' :
                     'text-orange-600 dark:text-orange-400'

  const scoreBg = data.score >= 80 ? 'bg-green-50 dark:bg-green-900/20' :
                  data.score >= 60 ? 'bg-blue-50 dark:bg-blue-900/20' :
                  'bg-orange-50 dark:bg-orange-900/20'

  const scoreRing = data.score >= 80 ? 'stroke-green-600 dark:stroke-green-400' :
                    data.score >= 60 ? 'stroke-blue-600 dark:stroke-blue-400' :
                    'stroke-orange-600 dark:stroke-orange-400'

  const breakdownData = Object.entries(data.breakdown).map(([key, value]) => ({
    category: key.charAt(0).toUpperCase() + key.slice(1),
    score: value.score,
    fullMark: 100,
  }))

  const icons = {
    streaming: Music,
    engagement: Heart,
    social: Users,
    monetary: DollarSign,
    loyalty: Zap,
  }

  return (
    <div className="space-y-6">
      {/* Artist Selection Header */}
      <AnalyticsPageHeader />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fan Value Score</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Identifies monetizable superfans among millions of listeners
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-900 dark:text-blue-300">Score updates daily</span>
        </div>
      </div>

      {/* Main Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Score Circle */}
        <div className={`rounded-xl border border-gray-200 dark:border-gray-800 ${scoreBg} p-8`}>
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Circular Progress */}
              <svg className="w-64 h-64 transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  strokeLinecap="round"
                  className={scoreRing}
                  strokeDasharray={`${2 * Math.PI * 110}`}
                  strokeDashoffset={`${2 * Math.PI * 110 * (1 - data.score / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>

              {/* Score Number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-7xl font-bold ${scoreColor}`}>{data.score}</span>
                <span className="text-xl text-gray-500 dark:text-gray-400">out of 100</span>
              </div>
            </div>

            {/* Trend */}
            <div className="mt-6 flex items-center gap-2">
              {data.trend >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-lg font-semibold ${data.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {data.trend >= 0 ? '+' : ''}{data.trend}%
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">vs last month</span>
            </div>

            {/* Score Interpretation */}
            <div className="mt-4 text-center">
              <p className={`text-lg font-semibold ${scoreColor}`}>
                {data.score >= 80 ? 'Excellent' : data.score >= 60 ? 'Good' : 'Needs Improvement'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {data.score >= 80 ? 'Strong superfan base with high monetization potential' :
                 data.score >= 60 ? 'Solid fanbase with growth opportunities' :
                 'Focus on engagement and loyalty building'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Breakdown Radar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Score Breakdown</h3>

          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={breakdownData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
                <Radar
                  name="FVS"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(data.breakdown).map(([key, value]) => {
          const Icon = icons[key as keyof typeof icons]
          return (
            <div
              key={key}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{key}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{value.weight}% weight</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{value.score}</span>
                  <span className="text-sm text-gray-400 dark:text-gray-600">/100</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                    style={{ width: `${value.score}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400">{value.value}</p>
            </div>
          )
        })}
      </div>

      {/* Historical Trend */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">12-Month Trend</h3>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">Key Insights</h3>
        <ul className="space-y-2">
          {data.insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <span className="text-sm text-blue-800 dark:text-blue-200">{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock data.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/analytics/{'{artist_id}'}/fvs
          </code> for real-time data.
        </p>
      </div>
    </div>
  )
}
