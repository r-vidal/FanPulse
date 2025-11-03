import { api } from '../api'
import type { Report, ReportRequest } from '@/types'

export const reportsApi = {
  /**
   * Get all reports for the current user
   */
  async getAll(): Promise<Report[]> {
    const response = await api.get('/api/reports')
    return response.data
  },

  /**
   * Get a specific report
   */
  async getById(reportId: string): Promise<Report> {
    const response = await api.get(`/api/reports/${reportId}`)
    return response.data
  },

  /**
   * Generate a new report
   */
  async generate(data: ReportRequest): Promise<Report> {
    const response = await api.post('/api/reports/generate', data)
    return response.data
  },

  /**
   * Download a report
   */
  async download(reportId: string): Promise<Blob> {
    const response = await api.get(`/api/reports/${reportId}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Delete a report
   */
  async delete(reportId: string): Promise<void> {
    await api.delete(`/api/reports/${reportId}`)
  },

  /**
   * Get report preview (HTML only)
   */
  async preview(reportId: string): Promise<string> {
    const response = await api.get(`/api/reports/${reportId}/preview`)
    return response.data
  },
}
