import { api } from '../api'

export interface ArtistStats {
  artist_id: string
  artist_name: string
  artist_image: string | null
  artist_genre: string | null

  // Social media connections
  spotify_id?: string | null
  instagram_id?: string | null
  youtube_id?: string | null
  apple_music_id?: string | null
  tiktok_id?: string | null
  twitter_id?: string | null
  facebook_id?: string | null

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
  status: 'fire' | 'growing' | 'stable' | 'declining'
}

export interface TopTrack {
  id: string
  name: string
  streams: number
  spotify_url?: string
  preview_url?: string
  image_url?: string
}

export const artistDetailApi = {
  /**
   * Get aggregated statistics for a specific artist
   */
  getStats: async (artistId: string): Promise<ArtistStats> => {
    const response = await api.get(`/api/artist-detail/${artistId}/stats`)
    return response.data
  },

  /**
   * Get momentum score history for charting
   */
  getMomentumHistory: async (artistId: string, days: number = 90): Promise<MomentumDataPoint[]> => {
    const response = await api.get(`/api/artist-detail/${artistId}/momentum-history`, {
      params: { days }
    })
    return response.data
  },

  /**
   * Get top tracks for an artist
   */
  getTopTracks: async (artistId: string, limit: number = 10): Promise<TopTrack[]> => {
    const response = await api.get(`/api/artist-detail/${artistId}/top-tracks`, {
      params: { limit }
    })
    return response.data
  }
}
