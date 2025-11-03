import { api } from '../api'
import type { ApiKey, ApiKeyUsage } from '@/types'

export interface CreateApiKeyRequest {
  name: string
  rate_limit?: number
  expires_in_days?: number
}

export interface CreateApiKeyResponse {
  api_key: ApiKey
  full_key: string // Only returned once!
}

export const apiKeysApi = {
  /**
   * Get all API keys for the current user
   */
  async getAll(): Promise<ApiKey[]> {
    const response = await api.get('/api/api-keys')
    return response.data
  },

  /**
   * Create a new API key
   */
  async create(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const response = await api.post('/api/api-keys', data)
    return response.data
  },

  /**
   * Get API key usage statistics
   */
  async getUsage(keyId: string): Promise<ApiKeyUsage> {
    const response = await api.get(`/api/api-keys/${keyId}/usage`)
    return response.data
  },

  /**
   * Revoke (deactivate) an API key
   */
  async revoke(keyId: string): Promise<void> {
    await api.delete(`/api/api-keys/${keyId}`)
  },

  /**
   * Regenerate an API key
   */
  async regenerate(keyId: string): Promise<CreateApiKeyResponse> {
    const response = await api.post(`/api/api-keys/${keyId}/regenerate`)
    return response.data
  },
}
