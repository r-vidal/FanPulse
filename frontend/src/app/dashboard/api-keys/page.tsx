'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { apiKeysApi } from '@/lib/api/apiKeys'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import {
  Key,
  Copy,
  Trash2,
  BarChart,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { ApiKey, ApiKeyUsage } from '@/types'

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [selectedKeyUsage, setSelectedKeyUsage] = useState<{ id: string; usage: ApiKeyUsage } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000)
  const [newKeyExpireDays, setNewKeyExpireDays] = useState<number | undefined>(undefined)
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      const data = await apiKeysApi.getAll()
      setApiKeys(data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err)
      setError(err.response?.data?.detail || 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key')
      return
    }

    try {
      const result = await apiKeysApi.create({
        name: newKeyName,
        rate_limit: newKeyRateLimit,
        expires_in_days: newKeyExpireDays,
      })
      setCreatedKey(result.full_key)
      setNewKeyName('')
      setNewKeyRateLimit(1000)
      setNewKeyExpireDays(undefined)
      setShowCreateModal(false)
      fetchApiKeys()
    } catch (err: any) {
      console.error('Failed to create API key:', err)
      alert(err.response?.data?.detail || 'Failed to create API key')
    }
  }

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke "${keyName}"? This cannot be undone.`)) {
      return
    }

    try {
      await apiKeysApi.revoke(keyId)
      fetchApiKeys()
    } catch (err: any) {
      console.error('Failed to revoke API key:', err)
      alert(err.response?.data?.detail || 'Failed to revoke API key')
    }
  }

  const handleViewUsage = async (keyId: string) => {
    try {
      const usage = await apiKeysApi.getUsage(keyId)
      setSelectedKeyUsage({ id: keyId, usage })
    } catch (err: any) {
      console.error('Failed to fetch usage:', err)
      alert(err.response?.data?.detail || 'Failed to fetch usage statistics')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">API Keys</h2>
              <p className="mt-2 text-gray-600">
                Manage API keys for programmatic access to FanPulse
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Key
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {/* New Key Created Alert */}
          {createdKey && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-2">
                    API Key Created Successfully!
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    Make sure to copy your API key now. You won't be able to see it again!
                  </p>
                  <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-green-200">
                    <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                      {createdKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdKey)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setCreatedKey(null)}
                  className="text-green-600 hover:text-green-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* API Keys List */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <Key className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">No API Keys Yet</h3>
              <p className="text-blue-700 mb-4">
                Create your first API key to start accessing the FanPulse API programmatically.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                        {key.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <code className="px-2 py-1 bg-gray-100 text-gray-900 rounded font-mono text-sm">
                          {key.key_prefix}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.key_prefix)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copy prefix"
                        >
                          <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Rate Limit:</span>
                          <p className="font-semibold text-gray-900">
                            {key.rate_limit.toLocaleString()}/hour
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Usage:</span>
                          <p className="font-semibold text-gray-900">
                            {key.usage_count.toLocaleString()} requests
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Used:</span>
                          <p className="font-semibold text-gray-900">
                            {formatDate(key.last_used_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <p className="font-semibold text-gray-900">
                            {key.expires_at ? formatDate(key.expires_at) : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewUsage(key.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View usage statistics"
                      >
                        <BarChart className="w-5 h-5" />
                      </button>
                      {key.is_active && (
                        <button
                          onClick={() => handleRevokeKey(key.id, key.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Revoke key"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Usage Stats (if selected) */}
                  {selectedKeyUsage?.id === key.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Usage Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-blue-700">Total Requests</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {selectedKeyUsage.usage.total_requests.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-green-700">Successful</p>
                          <p className="text-2xl font-bold text-green-900">
                            {selectedKeyUsage.usage.successful_requests.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                          <p className="text-sm text-red-700">Failed</p>
                          <p className="text-2xl font-bold text-red-900">
                            {selectedKeyUsage.usage.failed_requests.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700">Avg Response Time</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedKeyUsage.usage.avg_response_time.toFixed(0)}ms
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Last 24 Hours</p>
                          <p className="text-lg font-bold text-gray-900">
                            {selectedKeyUsage.usage.last_24h.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last 7 Days</p>
                          <p className="text-lg font-bold text-gray-900">
                            {selectedKeyUsage.usage.last_7d.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last 30 Days</p>
                          <p className="text-lg font-bold text-gray-900">
                            {selectedKeyUsage.usage.last_30d.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create Key Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create New API Key</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Name *
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API, Mobile App"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Limit (requests/hour)
                    </label>
                    <input
                      type="number"
                      value={newKeyRateLimit}
                      onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                      min={100}
                      max={10000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires In (Days) - Optional
                    </label>
                    <input
                      type="number"
                      value={newKeyExpireDays || ''}
                      onChange={(e) =>
                        setNewKeyExpireDays(e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder="Leave empty for no expiration"
                      min={1}
                      max={365}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleCreateKey} className="flex-1">
                    Create Key
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Documentation */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">API Documentation</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Base URL:</strong>{' '}
                <code className="bg-white px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                </code>
              </p>
              <p>
                <strong>Authentication:</strong> Include your API key in the{' '}
                <code className="bg-white px-2 py-1 rounded">X-API-Key</code> header
              </p>
              <p>
                <strong>Example:</strong>
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                {`curl -H "X-API-Key: your_api_key_here" \\
  ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/artists/`}
              </pre>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
