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
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/dashboard/stats')
    return response.data
  },

  /**
   * Get top performing artists by momentum
   */
  getTopPerformers: async (limit: number = 5): Promise<TopArtist[]> => {
    const response = await api.get('/api/dashboard/top-performers', {
      params: { limit }
    })
    return response.data
  },

  /**
   * Get recent activity across all artists
   */
  getRecentActivity: async (limit: number = 10): Promise<RecentActivity[]> => {
    const response = await api.get('/api/dashboard/recent-activity', {
      params: { limit }
    })
    return response.data
  }
}
