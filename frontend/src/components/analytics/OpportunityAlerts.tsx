'use client'

import { useState, useMemo } from 'react'
import { mockOpportunityAlerts, OpportunityAlert, AlertType, AlertPriority, AlertStatus } from '@/lib/mockData'
import {
  Bell, Music, TrendingUp, Users, DollarSign, MapPin, Mic, Zap,
  Filter, CheckCircle2, Eye, Clock, AlertTriangle, X
} from 'lucide-react'

/**
 * Opportunity Alerts Center
 * Real-time notifications for actionable opportunities
 * Mock data: GET /api/alerts/opportunities
 */
export default function OpportunityAlerts({ artistId }: { artistId?: string }) {
  const [alerts, setAlerts] = useState<OpportunityAlert[]>(mockOpportunityAlerts(20))
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all')
  const [selectedAlert, setSelectedAlert] = useState<OpportunityAlert | null>(null)

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(alert => typeFilter === 'all' || alert.type === typeFilter)
      .filter(alert => priorityFilter === 'all' || alert.priority === priorityFilter)
      .filter(alert => statusFilter === 'all' || alert.status === statusFilter)
      .sort((a, b) => {
        // Sort by priority first, then timestamp
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
  }, [alerts, typeFilter, priorityFilter, statusFilter])

  // Stats
  const stats = useMemo(() => {
    return {
      total: alerts.length,
      new: alerts.filter(a => a.status === 'new').length,
      critical: alerts.filter(a => a.priority === 'critical').length,
      expiring: alerts.filter(a => {
        if (!a.expiresAt) return false
        const daysUntil = (new Date(a.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        return daysUntil <= 3
      }).length,
    }
  }, [alerts])

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'read' as AlertStatus } : a))
  }

  const markAsActed = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acted' as AlertStatus } : a))
  }

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    if (selectedAlert?.id === id) {
      setSelectedAlert(null)
    }
  }

  const getTypeIcon = (type: AlertType) => {
    const icons = {
      playlist: Music,
      viral: TrendingUp,
      collab: Users,
      sync: DollarSign,
      tour: MapPin,
      media: Mic,
      trending: Zap,
    }
    return icons[type]
  }

  const getTypeColor = (type: AlertType) => {
    const colors = {
      playlist: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
      viral: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
      collab: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
      sync: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
      tour: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30',
      media: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
      trending: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30',
    }
    return colors[type]
  }

  const getPriorityColor = (priority: AlertPriority) => {
    const colors = {
      critical: 'border-l-red-500 dark:border-l-red-400 bg-red-50/50 dark:bg-red-900/10',
      high: 'border-l-orange-500 dark:border-l-orange-400 bg-orange-50/50 dark:bg-orange-900/10',
      medium: 'border-l-blue-500 dark:border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/10',
      low: 'border-l-gray-400 dark:border-l-gray-600 bg-gray-50/50 dark:bg-gray-900/10',
    }
    return colors[priority]
  }

  const getStatusBadge = (status: AlertStatus) => {
    const badges = {
      new: <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">New</span>,
      read: <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">Read</span>,
      acted: <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">Acted</span>,
    }
    return badges[status]
  }

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getExpiresIn = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days <= 0) return 'Expired'
    if (days === 1) return 'Expires tomorrow'
    if (days <= 3) return `Expires in ${days} days`
    return `Expires ${new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Opportunity Alerts</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time notifications for actionable opportunities
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">New</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.new}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.critical}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expiring}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AlertType | 'all')}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="playlist">Playlist</option>
            <option value="viral">Viral</option>
            <option value="collab">Collaboration</option>
            <option value="sync">Sync/Licensing</option>
            <option value="tour">Tour</option>
            <option value="media">Media</option>
            <option value="trending">Trending</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as AlertPriority | 'all')}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'all')}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="acted">Acted</option>
          </select>
        </div>
      </div>

      {/* Alerts Timeline */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No alerts match your filters</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = getTypeIcon(alert.type)
            const isExpiring = alert.expiresAt && (new Date(alert.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 3

            return (
              <div
                key={alert.id}
                className={`bg-white dark:bg-gray-900 rounded-xl border-l-4 ${getPriorityColor(alert.priority)} border-t border-r border-b border-gray-200 dark:border-gray-800 p-5 transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-lg ${getTypeColor(alert.type)}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{alert.title}</h3>
                          {getStatusBadge(alert.status)}
                          {alert.priority === 'critical' && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-xs font-bold">
                              URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{alert.description}</p>

                        {/* Metadata */}
                        {alert.metadata && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {alert.metadata.playlistName && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                📋 {alert.metadata.playlistName}
                              </span>
                            )}
                            {alert.metadata.artistName && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                👤 {alert.metadata.artistName}
                              </span>
                            )}
                            {alert.metadata.value && (
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                💰 €{alert.metadata.value.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Time info */}
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>{getTimeAgo(alert.timestamp)}</span>
                          {alert.expiresAt && (
                            <span className={isExpiring ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                              ⏰ {getExpiresIn(alert.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {alert.status === 'new' && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Eye className="w-4 h-4" />
                          Mark as Read
                        </button>
                      )}
                      {alert.status !== 'acted' && (
                        <button
                          onClick={() => markAsActed(alert.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark as Acted
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="px-3 py-1.5 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="ml-auto p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label="Delete alert"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAlert(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getTypeIcon(selectedAlert.type)
                    return (
                      <div className={`p-3 rounded-lg ${getTypeColor(selectedAlert.type)}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    )
                  })()}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{selectedAlert.title}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedAlert.status)}
                      <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                        {selectedAlert.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</p>
                <p className="text-gray-900 dark:text-white">{selectedAlert.description}</p>
              </div>

              {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Details</p>
                  <div className="space-y-2">
                    {selectedAlert.metadata.playlistName && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Playlist:</span> {selectedAlert.metadata.playlistName}
                      </p>
                    )}
                    {selectedAlert.metadata.artistName && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Artist:</span> {selectedAlert.metadata.artistName}
                      </p>
                    )}
                    {selectedAlert.metadata.platform && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Platform:</span> {selectedAlert.metadata.platform}
                      </p>
                    )}
                    {selectedAlert.metadata.value && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Estimated Value:</span> €{selectedAlert.metadata.value.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(selectedAlert.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {selectedAlert.expiresAt && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Expires</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(selectedAlert.expiresAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock data.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/alerts/opportunities
          </code> for real-time alerts.
        </p>
      </div>
    </div>
  )
}
