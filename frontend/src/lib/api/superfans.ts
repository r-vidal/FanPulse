/**
 * Superfans API Client
 *
 * Handles all Superfan API calls
 */

import { api } from '../api'

export interface Superfan {
  id: string
  platform_user_id: string
  fvs_score: number
  listening_hours: number
  engagement_score: number
  monetization_score: number
  location: string | null
  contact_info: any
  last_updated: string
  created_at: string
}

export interface SuperfanInsights {
  total_superfans: number
  active_last_30_days: number
  activity_rate: number
  tier_distribution: Record<string, number>
  average_lifetime_value: number
  average_engagement_score: number
  total_lifetime_value: number
  calculated_at: string
}

export interface SuperfanListResponse {
  artist_id: string
  artist_name: string
  total_superfans: number
  superfans: Superfan[]
}

export const superfansApi = {
  /**
   * Get superfan insights for an artist
   */
  getInsights: async (artistId: string): Promise<SuperfanInsights> => {
    const response = await api.get(`/api/analytics/${artistId}/superfans`)
    return response.data
  },

  /**
   * Get superfans for an artist (alias for list with default params)
   */
  getForArtist: async (artistId: string): Promise<Superfan[]> => {
    const response = await api.get(`/api/analytics/${artistId}/superfans/list`, {
      params: { min_score: 7.0, days: 90 }
    })
    return response.data.superfans || []
  },

  /**
   * List superfans for an artist
   */
  list: async (artistId: string, minScore: number = 7.0, days: number = 90): Promise<SuperfanListResponse> => {
    const response = await api.get(`/api/analytics/${artistId}/superfans/list`, {
      params: { min_score: minScore, days }
    })
    return response.data
  },

  /**
   * Get superfan segments
   */
  getSegments: async (artistId: string): Promise<any> => {
    const response = await api.get(`/api/analytics/${artistId}/superfans/segments`)
    return response.data
  },

  /**
   * Get churn risk analysis
   */
  getChurnRisk: async (artistId: string): Promise<any> => {
    const response = await api.get(`/api/analytics/${artistId}/superfans/churn-risk`)
    return response.data
  }
}
