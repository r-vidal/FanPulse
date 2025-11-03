/**
 * Momentum API Client
 *
 * Handles all Momentum Index API calls
 */

import { api } from '../api'

export interface MomentumSignals {
  popularity: number
  follower_growth: number
  top_tracks: number
}

export interface MomentumData {
  score: number // 0-10
  status: 'fire' | 'growing' | 'stable' | 'declining'
  signals: MomentumSignals
  trend_7d: number | null
  trend_30d: number | null
  data_points: {
    '7d': number
    '30d': number
  }
}

export const momentumApi = {
  /**
   * Get momentum score for an artist
   */
  getForArtist: async (artistId: string): Promise<MomentumData> => {
    const response = await api.get(`/api/momentum/${artistId}`)
    return response.data
  }
}
