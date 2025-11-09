import { api } from '../api'

export interface SocialEngagementData {
  date: string
  instagram: number
  tiktok: number
  youtube: number
}

export interface SocialStats {
  total_engagement: number
  change_7d: number
  best_platform: string
  avg_engagement_rate: number
}

export interface SocialEngagementResponse {
  data: SocialEngagementData[]
  stats: SocialStats
}

export interface OptimalTimeSlot {
  day: string
  hour: number
  engagement_score: number
  posts_count: number
  avg_engagement: number
}

export interface BestTimeToPostResponse {
  optimal_times: OptimalTimeSlot[]
  best_day: string
  best_hour: number
  recommendations: string[]
}

export const socialApi = {
  /**
   * Get social engagement data
   */
  getEngagement: async (
    timeRange: '7d' | '30d' | '90d' = '30d',
    artistId?: string
  ): Promise<SocialEngagementResponse> => {
    const params: any = { time_range: timeRange }
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/social/engagement', { params })
    return response.data
  },

  /**
   * Get optimal posting times
   */
  getOptimalTimes: async (artistId?: string): Promise<BestTimeToPostResponse> => {
    const params: any = {}
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/social/optimal-times', { params })
    return response.data
  },

  /**
   * Get social media ROI data
   */
  getROI: async (artistId?: string) => {
    const params: any = {}
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/social/roi', { params })
    return response.data
  },

  /**
   * Get platform-specific metrics
   */
  getPlatformMetrics: async (platform: string, artistId?: string) => {
    const params: any = { platform }
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/social/platform-metrics', { params })
    return response.data
  }
}
