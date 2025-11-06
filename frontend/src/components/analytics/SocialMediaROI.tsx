'use client'

import { useState } from 'react'
import { mockSocialMediaROI, SocialMediaMetrics, SocialPlatform } from '@/lib/mockData'
import { Instagram, Youtube, Twitter, Facebook, TrendingUp, DollarSign, Users, Eye, MousePointerClick, ShoppingBag } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

/**
 * Social Media ROI Dashboard
 * Cross-platform social media analytics and ROI tracking
 * Mock data: GET /api/analytics/{artist_id}/social-roi
 */
export default function SocialMediaROI({ artistId }: { artistId?: string }) {
  const [data] = useState<SocialMediaMetrics[]>(mockSocialMediaROI())
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | 'all'>('all')

  const platformIcons = {
    instagram: Instagram,
    tiktok: Music2Icon,
    twitter: Twitter,
    youtube: Youtube,
    facebook: Facebook,
  }

  const platformColors = {
    instagram: '#E4405F',
    tiktok: '#000000',
    twitter: '#1DA1F2',
    youtube: '#FF0000',
    facebook: '#1877F2',
  }

  const filteredData = selectedPlatform === 'all' ? data : data.filter(p => p.platform === selectedPlatform)

  // Calculate totals
  const totals = {
    followers: data.reduce((sum, p) => sum + p.followers, 0),
    reach: data.reduce((sum, p) => sum + p.reach, 0),
    engagement: data.reduce((sum, p) => sum + p.engagement.likes + p.engagement.comments + p.engagement.shares, 0),
    adSpend: data.reduce((sum, p) => sum + p.adSpend, 0),
    revenue: data.reduce((sum, p) => sum + p.revenue, 0),
    avgROI: Math.round(data.reduce((sum, p) => sum + p.roi, 0) / data.length),
  }

  // Prepare comparison chart data
  const comparisonData = data.map(p => ({
    platform: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    followers: p.followers,
    engagement: p.engagement.rate,
    roi: p.roi,
  }))

  // Synergy radar chart data
  const synergyData = [
    {
      metric: 'Reach',
      value: Math.round(data.reduce((sum, p) => sum + p.reach, 0) / data.length / 10000),
      fullMark: 50,
    },
    {
      metric: 'Engagement',
      value: Math.round(data.reduce((sum, p) => sum + p.engagement.rate, 0) / data.length * 10),
      fullMark: 100,
    },
    {
      metric: 'Conversion',
      value: Math.round(data.reduce((sum, p) => sum + p.clickThroughRate, 0) / data.length * 10),
      fullMark: 50,
    },
    {
      metric: 'Growth',
      value: Math.round(data.reduce((sum, p) => sum + (p.followerGrowth > 0 ? p.followerGrowth : 0), 0) / data.length * 2),
      fullMark: 50,
    },
    {
      metric: 'ROI',
      value: Math.min(100, Math.round(totals.avgROI / 5)),
      fullMark: 100,
    },
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
  }

  const getROIColor = (roi: number) => {
    if (roi >= 200) return 'text-green-600 dark:text-green-400'
    if (roi >= 100) return 'text-blue-600 dark:text-blue-400'
    if (roi >= 0) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Social Media ROI</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Cross-platform analytics and return on investment tracking
        </p>
      </div>

      {/* Platform Selector */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedPlatform === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All Platforms
        </button>
        {data.map((platform) => {
          const Icon = platformIcons[platform.platform]
          return (
            <button
              key={platform.platform}
              onClick={() => setSelectedPlatform(platform.platform)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPlatform === platform.platform
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
            </button>
          )
        })}
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Followers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(totals.followers)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Reach</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(totals.reach)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">€{formatNumber(totals.revenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg ROI</p>
              <p className={`text-2xl font-bold ${getROIColor(totals.avgROI)}`}>{totals.avgROI}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Comparison Charts */}
      {selectedPlatform === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Followers & Engagement Comparison */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Platform Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="platform" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="followers" fill="#3B82F6" name="Followers" />
                  <Bar yAxisId="right" dataKey="engagement" fill="#8B5CF6" name="Engagement %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cross-Platform Synergy Radar */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Cross-Platform Synergy</h3>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={synergyData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Radar name="Performance" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Platform Details */}
      <div className="grid grid-cols-1 gap-4">
        {filteredData.map((platform) => {
          const Icon = platformIcons[platform.platform]
          const color = platformColors[platform.platform]

          return (
            <div
              key={platform.platform}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              {/* Platform Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-8 h-8" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                      {platform.platform}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatNumber(platform.followers)} followers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Growth</p>
                  <p className={`text-2xl font-bold ${
                    platform.followerGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {platform.followerGrowth >= 0 ? '+' : ''}{platform.followerGrowth}%
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Engagement Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{platform.engagement.rate}%</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Reach</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(platform.reach)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">CTR</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{platform.clickThroughRate}%</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  platform.roi >= 200 ? 'bg-green-50 dark:bg-green-900/20' :
                  platform.roi >= 100 ? 'bg-blue-50 dark:bg-blue-900/20' :
                  platform.roi >= 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                  'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ROI</p>
                  <p className={`text-xl font-bold ${getROIColor(platform.roi)}`}>
                    {platform.roi >= 0 ? '+' : ''}{platform.roi}%
                  </p>
                </div>
              </div>

              {/* Conversions & Revenue */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Conversions */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Conversions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Streams Generated</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatNumber(platform.conversions.streams)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Tickets Sold</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {platform.conversions.ticketsSold}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Merch Sales</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {platform.conversions.merchSales}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revenue Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Financial Overview</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Ad Spend</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        -€{platform.adSpend.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Revenue Generated</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        +€{platform.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Net Profit</span>
                      <span className={`text-sm font-bold ${getROIColor(platform.roi)}`}>
                        €{(platform.revenue - platform.adSpend).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Performance */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">8-Week Performance</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={platform.weeklyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <YAxis yAxisId="left" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="followers" stroke="#3B82F6" strokeWidth={2} name="Followers" />
                      <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#8B5CF6" strokeWidth={2} name="Engagement %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Content */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top Performing Content</h4>
                <div className="space-y-2">
                  {platform.topContent.map((content, i) => (
                    <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{content.type}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(content.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(content.views)} views</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{content.engagement}% engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock data.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/analytics/{'{artist_id}'}/social-roi
          </code> for real-time social media analytics.
        </p>
      </div>
    </div>
  )
}

// TikTok icon component (since lucide doesn't have it)
function Music2Icon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}
