import { api } from '../api'

export interface ArtistStats {
  artist_id: string
  artist_name: string
  artist_image: string | null
  artist_genre: string | null

  // Current metrics
  current_momentum: number
  momentum_status: string
  total_superfans: number
  total_streams: number
  pending_actions: number
  critical_actions: number
  recent_alerts: number

  // Trends
  momentum_trend_7d: number | null
  momentum_trend_30d: number | null
}

export interface MomentumDataPoint {
  date: string
  score: number
  category: string
}

export const artistDetailApi = {
  /**
   * Get aggregated statistics for a specific artist
   */
  getStats: async (artistId: string): Promise<ArtistStats> => {
    const response = await api.get(`/api/artists/${artistId}/stats`)
    return response.data
  },

  /**
   * Get momentum score history for charting
   */
  getMomentumHistory: async (artistId: string, days: number = 90): Promise<MomentumDataPoint[]> => {
    const response = await api.get(`/api/artists/${artistId}/momentum-history`, {
      params: { days }
    })
    return response.data
  }
}
