/**
 * Actions API Client
 *
 * Handles all Next Best Action API calls
 */

import { api } from '../api'

export interface NextAction {
  id: string
  artist_id: string
  artist_name: string
  action_type: string
  title: string
  description: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  reason: string | null
  expected_impact: string | null
  status: 'pending' | 'completed' | 'snoozed' | 'ignored'
  created_at: string
  completed_at: string | null
}

export const actionsApi = {
  /**
   * Get the single highest-priority action across all artists
   */
  getNext: async (): Promise<NextAction | null> => {
    const response = await api.get('/api/actions/next')
    return response.data
  },

  /**
   * Get all actions for a specific artist
   */
  getForArtist: async (artistId: string): Promise<NextAction[]> => {
    const response = await api.get(`/api/actions/artist/${artistId}`)
    return response.data
  },

  /**
   * Update action status (completed, snoozed, ignored)
   */
  updateStatus: async (actionId: string, status: 'completed' | 'snoozed' | 'ignored'): Promise<NextAction> => {
    const response = await api.post(`/api/actions/${actionId}/update`, { status })
    return response.data
  },

  /**
   * Get all actions for current user (across all artists)
   */
  getAll: async (): Promise<NextAction[]> => {
    // This would require a new backend endpoint
    // For now, we'll need to fetch per artist and combine
    // TODO: Add /api/actions/all endpoint to backend
    throw new Error('Not yet implemented - needs backend endpoint')
  }
}
