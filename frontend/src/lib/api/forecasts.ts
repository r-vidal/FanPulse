import { api } from '../api'
import type { RevenueForecastResponse, RevenuePrediction } from '@/types'

export const forecastsApi = {
  /**
   * Get revenue forecast for an artist
   */
  async getForecast(
    artistId: string,
    months: number = 12
  ): Promise<RevenueForecastResponse> {
    const response = await api.get(`/api/forecasts/${artistId}`, {
      params: { months },
    })
    return response.data
  },

  /**
   * Generate new forecast
   */
  async generateForecast(
    artistId: string,
    months: number = 12
  ): Promise<RevenueForecastResponse> {
    const response = await api.post(`/api/forecasts/${artistId}/generate`, {
      months,
    })
    return response.data
  },

  /**
   * Get forecast history
   */
  async getForecastHistory(artistId: string): Promise<RevenuePrediction[]> {
    const response = await api.get(`/api/forecasts/${artistId}/history`)
    return response.data
  },

  /**
   * Export forecast data as CSV
   */
  async exportForecast(artistId: string): Promise<Blob> {
    const response = await api.get(`/api/forecasts/${artistId}/export`, {
      responseType: 'blob',
    })
    return response.data
  },
}
