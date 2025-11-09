import { api } from '../api'

export interface StreamDataPoint {
  date: string
  total: number
  spotify: number
  appleMusic: number
  youtube: number
  other: number
}

export interface StreamStats {
  total_30d: number
  change_30d: number
  average_daily: number
  peak_day: string
  peak_streams: number
}

export interface StreamEvolutionResponse {
  data: StreamDataPoint[]
  stats: StreamStats
}

export const streamsApi = {
  /**
   * Get stream evolution data for selected time range
   */
  getEvolution: async (
    timeRange: '7d' | '30d' | '90d' = '30d',
    artistId?: string
  ): Promise<StreamEvolutionResponse> => {
    const params: any = { time_range: timeRange }
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/streams/evolution', { params })
    return response.data
  },

  /**
   * Get streaming platform breakdown
   */
  getPlatformBreakdown: async (artistId?: string) => {
    const params: any = {}
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/streams/platforms', { params })
    return response.data
  },

  /**
   * Get top tracks by streams
   */
  getTopTracks: async (limit: number = 10, artistId?: string) => {
    const params: any = { limit }
    if (artistId && artistId !== 'all') {
      params.artist_id = artistId
    }
    const response = await api.get('/api/streams/top-tracks', { params })
    return response.data
  }
}
