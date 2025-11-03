import { api } from '../api'
import type { Opportunity, RealtimeAlert, AlertStats } from '@/types'

export const alertsApi = {
  /**
   * Scan for current opportunities
   */
  async scanOpportunities(): Promise<Opportunity[]> {
    const response = await api.get('/api/realtime-alerts/opportunities')
    return response.data
  },

  /**
   * Get all alerts
   */
  async getAll(params?: {
    unread_only?: boolean
    priority?: 'critical' | 'high' | 'medium' | 'low'
    limit?: number
  }): Promise<RealtimeAlert[]> {
    const response = await api.get('/api/realtime-alerts/alerts', { params })
    return response.data
  },

  /**
   * Get alert statistics
   */
  async getStats(days: number = 30): Promise<AlertStats> {
    const response = await api.get('/api/realtime-alerts/alerts/stats', {
      params: { days },
    })
    return response.data
  },

  /**
   * Mark an alert as read
   */
  async markAsRead(alertId: string): Promise<void> {
    await api.put(`/api/realtime-alerts/alerts/${alertId}/read`)
  },

  /**
   * Delete an alert
   */
  async delete(alertId: string): Promise<void> {
    await api.delete(`/api/realtime-alerts/alerts/${alertId}`)
  },

  /**
   * Get WebSocket connection info
   */
  getWebSocketUrl(): string {
    const token = localStorage.getItem('token')
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000'
    return `${wsProtocol}//${wsHost}/api/ws/alerts?token=${token}`
  },
}
