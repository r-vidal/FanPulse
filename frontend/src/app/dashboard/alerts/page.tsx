'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AlertNotification from '@/components/alerts/AlertNotification'
import { useWebSocket } from '@/hooks/useWebSocket'
import { alertsApi } from '@/lib/api/alerts'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import {
  Bell,
  BellOff,
  Zap,
  TrendingUp,
  Target,
  Trophy,
  AlertTriangle,
  RefreshCw,
  Trash2,
  CheckCircle,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { RealtimeAlert, AlertStats, Opportunity } from '@/types'

export default function AlertsPage() {
  const { isConnected, opportunities, latestAlert, refreshOpportunities, clearLatestAlert } =
    useWebSocket()

  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
    fetchStats()
  }, [])

  const fetchAlerts = async (unreadOnly = false) => {
    try {
      setLoading(true)
      const data = await alertsApi.getAll({ unread_only: unreadOnly, limit: 50 })
      setAlerts(data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch alerts:', err)
      setError(err.response?.data?.detail || 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await alertsApi.getStats(30)
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await alertsApi.markAsRead(alertId)
      setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, resolvedAt: new Date().toISOString() } : a)))
      fetchStats()
    } catch (err: any) {
      console.error('Failed to mark as read:', err)
      alert(err.response?.data?.detail || 'Failed to mark as read')
    }
  }

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return
    }

    try {
      await alertsApi.delete(alertId)
      setAlerts(alerts.filter((a) => a.id !== alertId))
      fetchStats()
    } catch (err: any) {
      console.error('Failed to delete alert:', err)
      alert(err.response?.data?.detail || 'Failed to delete alert')
    }
  }

  const handleScanOpportunities = async () => {
    try {
      setLoading(true)
      await alertsApi.scanOpportunities()
      refreshOpportunities()
      fetchAlerts()
      fetchStats()
    } catch (err: any) {
      console.error('Failed to scan opportunities:', err)
      alert(err.response?.data?.detail || 'Failed to scan opportunities')
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'viral_growth':
        return <Zap className="w-5 h-5" />
      case 'momentum_spike':
        return <TrendingUp className="w-5 h-5" />
      case 'plateau_break':
        return <Target className="w-5 h-5" />
      case 'milestone':
        return <Trophy className="w-5 h-5" />
      default:
        return <AlertTriangle className="w-5 h-5" />
    }
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-500 text-red-700'
      case 'high':
        return 'bg-orange-50 border-orange-500 text-orange-700'
      case 'medium':
        return 'bg-yellow-50 border-yellow-500 text-yellow-700'
      default:
        return 'bg-blue-50 border-blue-500 text-blue-700'
    }
  }

  const formatDate = (dateStr: string) => {
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
        {/* Alert Notification Toast */}
        <AlertNotification alert={latestAlert} onClose={clearLatestAlert} />

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Real-time Alerts</h2>
              <p className="mt-2 text-gray-600 flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-medium">Disconnected</span>
                  </>
                )}
                - Live opportunity detection powered by WebSocket
              </p>
            </div>
            <Button onClick={handleScanOpportunities} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Scan Now
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Alerts</span>
                  <Bell className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>

              <div className="bg-blue-50 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Unread</span>
                  <BellOff className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-900">{stats.unread}</p>
                <p className="text-xs text-blue-600 mt-1">Requires attention</p>
              </div>

              <div className="bg-red-50 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700">Critical</span>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-900">{stats.by_priority?.critical || 0}</p>
                <p className="text-xs text-red-600 mt-1">Urgent action needed</p>
              </div>

              <div className="bg-green-50 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">Last 24h</span>
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-900">{stats.last_24h}</p>
                <p className="text-xs text-green-600 mt-1">Recent activity</p>
              </div>
            </div>
          )}

          {/* Current Opportunities (WebSocket) */}
          {opportunities.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-green-600 animate-pulse" />
                Live Opportunities ({opportunities.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.slice(0, 4).map((opp) => (
                  <div
                    key={opp.id}
                    className={`border-2 rounded-lg p-4 ${getPriorityStyles(opp.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">{getIcon(opp.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold">{opp.title}</h4>
                          <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs font-semibold uppercase">
                            {opp.priority}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{opp.message}</p>
                        <p className="text-xs">
                          Artist: <strong>{opp.artist_name}</strong>
                        </p>
                        {opp.recommended_actions && opp.recommended_actions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                            <p className="text-xs font-semibold mb-1">Actions:</p>
                            <ul className="text-xs space-y-0.5">
                              {opp.recommended_actions.slice(0, 2).map((action, idx) => (
                                <li key={idx}>• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => {
                setFilter('all')
                fetchAlerts(false)
              }}
            >
              All Alerts
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'secondary'}
              onClick={() => {
                setFilter('unread')
                fetchAlerts(true)
              }}
            >
              Unread Only
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Alerts History */}
          {loading && alerts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <Bell className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">No Alerts Yet</h3>
              <p className="text-blue-700 mb-4">
                When opportunities are detected, they'll appear here in real-time.
              </p>
              <Button onClick={handleScanOpportunities}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Scan for Opportunities
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">Alert History</h3>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-lg shadow border ${
                    alert.resolvedAt ? 'border-gray-200 opacity-60' : 'border-gray-300'
                  } p-4`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`${
                            alert.severity === 'urgent'
                              ? 'text-red-600'
                              : alert.severity === 'warning'
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {getIcon(alert.type)}
                        </div>
                        <h4 className="font-semibold text-gray-900">{alert.type}</h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            alert.severity === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : alert.severity === 'warning'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        {alert.resolvedAt && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Read
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>

                      <p className="text-xs text-gray-500">{formatDate(alert.createdAt)}</p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {!alert.resolvedAt && (
                        <button
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
