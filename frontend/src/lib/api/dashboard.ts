import { api } from '../api'

export interface DashboardStats {
  total_artists: number
  total_streams: number
  avg_momentum: number
  total_superfans: number
  pending_actions: number
  critical_actions: number
  recent_alerts: number
  artists_growing: number
  artists_declining: number
}

export interface TopArtist {
  id: string
  name: string
  image_url: string | null
  momentum_score: number
  momentum_status: 'fire' | 'growing' | 'stable' | 'declining'
  trend_7d: number | null
}

export interface RecentActivity {
  type: 'action' | 'alert' | 'momentum_change'
  artist_id: string
  artist_name: string
  title: string
  description: string
  timestamp: string
  severity?: string
}

export const dashboardApi = {
  /**
   * Get aggregated dashboard statistics
   */
  getStats: async (artistId?: string): Promise<DashboardStats> => {
    const params: any = {}
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/dashboard/stats', { params })
    return response.data
  },

  /**
   * Get top performing artists by momentum
   */
  getTopPerformers: async (limit: number = 5, artistId?: string): Promise<TopArtist[]> => {
    const params: any = { limit }
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/dashboard/top-performers', { params })
    return response.data
  },

  /**
   * Get recent activity across all artists
   */
  getRecentActivity: async (limit: number = 10, artistId?: string): Promise<RecentActivity[]> => {
    const params: any = { limit }
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/dashboard/recent-activity', { params })
    return response.data
  }
}
