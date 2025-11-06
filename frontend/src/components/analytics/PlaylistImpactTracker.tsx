'use client'

import { useState } from 'react'
import { mockPlaylistImpacts, PlaylistImpact } from '@/lib/mockData'
import { Music, TrendingUp, DollarSign, Users, CheckCircle2, XCircle, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'

/**
 * Playlist Impact Tracker
 * Track ROI and performance metrics for each playlist placement
 * Mock data: GET /api/analytics/{artist_id}/playlist-impact
 */
export default function PlaylistImpactTracker({ artistId }: { artistId?: string }) {
  const [data] = useState<PlaylistImpact[]>(mockPlaylistImpacts())

  // Calculate totals
  const totalStreams = data.reduce((sum, p) => sum + p.streamsGenerated, 0)
  const avgROI = Math.round(data.reduce((sum, p) => sum + p.roi, 0) / data.length)
  const activeCount = data.filter(p => p.status === 'active').length
  const editorialCount = data.filter(p => p.editorial).length

  // Sort by streams for display
  const sortedByStreams = [...data].sort((a, b) => b.streamsGenerated - a.streamsGenerated)

  // Prepare projection chart data
  const projectionData = (playlist: PlaylistImpact) => {
    return [
      { week: 'Week 1', streams: playlist.projections.week_1 },
      { week: 'Week 2', streams: playlist.projections.week_2 },
      { week: 'Week 3', streams: playlist.projections.week_3 },
      { week: 'Week 4', streams: playlist.projections.week_4 },
    ]
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getROIColor = (roi: number) => {
    if (roi >= 500) return 'text-green-600 dark:text-green-400'
    if (roi >= 200) return 'text-blue-600 dark:text-blue-400'
    if (roi >= 0) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Playlist Impact Tracker</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track ROI and performance metrics for each playlist placement
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Streams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(totalStreams)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg ROI</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgROI}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Playlists</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}/{data.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Editorial</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{editorialCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Streams by Playlist Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Streams by Playlist</h3>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedByStreams} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis
                type="category"
                dataKey="playlistName"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value: number) => [formatNumber(value), 'Streams']}
              />
              <Bar dataKey="streamsGenerated" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                {sortedByStreams.map((entry, index) => (
                  <text key={`cell-${index}`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Playlist Cards */}
      <div className="grid grid-cols-1 gap-4">
        {sortedByStreams.map((playlist, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Playlist Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">{playlist.playlistName}</h4>
                      {playlist.editorial && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded text-xs font-semibold text-purple-700 dark:text-purple-300">
                          Editorial
                        </span>
                      )}
                      {playlist.status === 'active' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{(playlist.followers / 1000).toFixed(0)}K followers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Added {new Date(playlist.placementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className={`flex items-center gap-1 font-semibold ${playlist.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {playlist.status === 'active' ? '● Active' : '● Removed'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Streams Generated</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {formatNumber(playlist.streamsGenerated)}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    playlist.roi >= 500 ? 'bg-green-50 dark:bg-green-900/20' :
                    playlist.roi >= 200 ? 'bg-blue-50 dark:bg-blue-900/20' :
                    playlist.roi >= 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                    'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ROI</p>
                    <p className={`text-2xl font-bold ${getROIColor(playlist.roi)}`}>
                      {playlist.roi >= 0 ? '+' : ''}{playlist.roi}%
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Est. Revenue</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      €{Math.round(playlist.streamsGenerated * 0.003).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Performance vs Avg</span>
                    <span>{((playlist.streamsGenerated / (totalStreams / data.length)) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        playlist.streamsGenerated > totalStreams / data.length * 1.5 ? 'bg-green-500' :
                        playlist.streamsGenerated > totalStreams / data.length ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(100, (playlist.streamsGenerated / (totalStreams / data.length)) * 50)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Projections Chart */}
              <div className="lg:w-96">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">4-Week Projection</h5>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectionData(playlist)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="week"
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      />
                      <YAxis
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [formatNumber(value), 'Streams']}
                      />
                      <Line
                        type="monotone"
                        dataKey="streams"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ROI Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">Key Insights</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-3">
            <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {sortedByStreams[0].playlistName} is your top performer with {formatNumber(sortedByStreams[0].streamsGenerated)} streams
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Editorial playlists generate {Math.round((data.filter(p => p.editorial).reduce((sum, p) => sum + p.streamsGenerated, 0) / totalStreams) * 100)}% of total streams
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Average ROI of {avgROI}% - {avgROI >= 300 ? 'excellent' : avgROI >= 150 ? 'good' : 'needs improvement'} performance
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {data.filter(p => p.status === 'removed').length} playlists have removed your track - focus on retention strategies
            </span>
          </li>
        </ul>
      </div>

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock data.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/analytics/{'{artist_id}'}/playlist-impact
          </code> for real-time playlist performance data.
        </p>
      </div>
    </div>
  )
}
