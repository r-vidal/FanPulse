'use client'

/**
 * SocialEngagementV2 - Graph engagement multi-platform
 * Multi-line chart (IG + TikTok + YouTube) avec best performing posts
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
import { Heart, TrendingUp, MessageCircle, Share2, Eye } from 'lucide-react'
import { socialApi, SocialEngagementData, SocialStats } from '@/lib/api/social'

interface TopPost {
  platform: 'instagram' | 'tiktok' | 'youtube'
  title: string
  engagement: number
  type: 'likes' | 'views' | 'comments'
  date: string
}

export function SocialEngagementV2() {
  const [data, setData] = useState<SocialEngagementData[]>([])
  const [topPosts, setTopPosts] = useState<TopPost[]>([])
  const [stats, setStats] = useState<SocialStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEngagementData()
  }, [])

  const loadEngagementData = async () => {
    try {
      setLoading(true)

      // Fetch data from API
      const response = await socialApi.getEngagement('30d')

      setData(response.data)
      setStats(response.stats)

      // Mock top posts (TODO: Create API endpoint for this)
      const mockTopPosts: TopPost[] = [
        {
          platform: 'tiktok',
          title: 'Behind the scenes studio session',
          engagement: 45200,
          type: 'views',
          date: '2 days ago'
        },
        {
          platform: 'instagram',
          title: 'New single announcement',
          engagement: 3840,
          type: 'likes',
          date: '5 days ago'
        },
        {
          platform: 'youtube',
          title: 'Official music video',
          engagement: 12500,
          type: 'views',
          date: '1 week ago'
        }
      ]
      setTopPosts(mockTopPosts)
    } catch (error) {
      console.error('Failed to load engagement data:', error)
      setData([])
      setStats(null)
      setTopPosts([])
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Heart className="w-4 h-4" />
      case 'tiktok':
        return <Share2 className="w-4 h-4" />
      case 'youtube':
        return <Eye className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-gradient-to-br from-purple-500 to-pink-500'
      case 'tiktok':
        return 'bg-black dark:bg-gray-800'
      case 'youtube':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload) return null

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {payload[0]?.payload.date}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
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
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Social Engagement</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Cross-platform engagement trends
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 border border-pink-200 dark:border-pink-800">
            <div className="text-xs font-medium text-pink-700 dark:text-pink-400 mb-1">
              Total Engagement
            </div>
            <div className="text-lg font-bold text-pink-900 dark:text-pink-100">
              {formatNumber(stats.total_engagement)}
            </div>
          </div>

          <div className={`rounded-lg p-3 border ${
            stats.change_7d >= 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className={`text-xs font-medium mb-1 ${
              stats.change_7d >= 0
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}>
              Weekly Change
            </div>
            <div className={`text-lg font-bold flex items-center gap-1 ${
              stats.change_7d >= 0
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              <TrendingUp className={`w-4 h-4 ${stats.change_7d < 0 ? 'rotate-180' : ''}`} />
              {stats.change_7d > 0 ? '+' : ''}{stats.change_7d.toFixed(1)}%
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
              Avg. Rate
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {stats.avg_engagement_rate}%
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">
              Best Platform
            </div>
            <div className="text-sm font-bold text-purple-900 dark:text-purple-100 capitalize">
              {stats.best_platform}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-64 mb-6">
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
              dataKey="instagram"
              name="Instagram"
              stroke="#e1306c"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="tiktok"
              name="TikTok"
              stroke="#000000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="youtube"
              name="YouTube"
              stroke="#ff0000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performing Posts */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Top Performing Posts</h4>
        <div className="space-y-3">
          {topPosts.map((post, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {/* Platform Badge */}
              <div className={`w-10 h-10 rounded-lg ${getPlatformColor(post.platform)} flex items-center justify-center text-white flex-shrink-0`}>
                {getPlatformIcon(post.platform)}
              </div>

              {/* Post Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {post.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {post.date} • {post.platform}
                </p>
              </div>

              {/* Engagement */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatNumber(post.engagement)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {post.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
