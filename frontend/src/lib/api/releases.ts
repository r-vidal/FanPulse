import { api } from '../api'
import type { ReleaseOptimization, ReleaseScore } from '@/types'

export const releasesApi = {
  /**
   * Get optimal release dates for an artist
   */
  async getOptimalDates(
    artistId: string,
    startDate: string,
    endDate: string
  ): Promise<ReleaseOptimization> {
    const response = await api.get(`/api/releases/optimize/${artistId}`, {
      params: { start_date: startDate, end_date: endDate },
    })
    return response.data
  },

  /**
   * Get release score for a specific date
   */
  async getDateScore(artistId: string, releaseDate: string): Promise<ReleaseScore> {
    const response = await api.get(`/api/releases/score/${artistId}`, {
      params: { release_date: releaseDate },
    })
    return response.data
  },

  /**
   * Get all release scores for an artist
   */
  async getAllScores(artistId: string): Promise<ReleaseScore[]> {
    const response = await api.get(`/api/releases/${artistId}/history`)
    return response.data
  },
}
