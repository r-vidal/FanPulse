'use client'

/**
 * Smart Alerts Dashboard - Intelligent Alerting (ML-Based)
 *
 * Différence vs alertes classiques:
 * - Baselines DYNAMIQUES par artiste (pas de seuils fixes)
 * - Machine Learning anomaly detection (Isolation Forest)
 * - Smart de-duplication (pas de spam)
 * - Confidence levels (High 90%+, Medium 70-90%, Low <70%)
 *
 * 7 Alert Types:
 * 1. 🔥 Viral Spike - Streams +50%+ in 24h
 * 2. 📉 Momentum Drop - Momentum -20%+ in 7d
 * 3. 🎵 Playlist Add - New playlist detected
 * 4. ❌ Playlist Remove - Playlist removal
 * 5. 👥 Fan Spike - Followers +30%+ in 24h
 * 6. 💬 Engagement Crash - Engagement <50% baseline for 3+ posts
 * 7. ⏰ Best Time to Post - Audience peak in next 2h
 *
 * REF: FanPulse IA Guide - Use Case #10
 */

import { useState } from 'react'
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Music,
  Users,
  MessageCircle,
  Clock,
  Flame,
  CheckCircle,
  X,
  Filter,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'

export type AlertType = 'viral_spike' | 'momentum_drop' | 'playlist_add' | 'playlist_remove' | 'fan_spike' | 'engagement_crash' | 'best_time_post'
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface SmartAlert {
  id: string
  type: AlertType
  priority: AlertPriority
  title: string
  message: string
  artistId: string
  artistName: string
  timestamp: Date
  confidence: number // 0-100%
  confidenceLevel: ConfidenceLevel
  baseline: {
    metric: string
    current: number
    baseline: number
    change: number // percentage
  }
  mlInsights: string[]
  actions: {
    primary: string
    secondary?: string
  }
  isRead: boolean
  isDismissed: boolean
}

export default function SmartAlertsDashboard() {
  const [alerts, setAlerts] = useState<SmartAlert[]>(mockAlerts)
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<AlertPriority | 'all'>('all')
  const [showDismissed, setShowDismissed] = useState(false)
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null)

  const handleMarkRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a))
  }

  const handleDismiss = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isDismissed: true } : a))
  }

  const handleRestore = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isDismissed: false } : a))
  }

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'viral_spike':
        return <Flame className="w-5 h-5" />
      case 'momentum_drop':
        return <TrendingDown className="w-5 h-5" />
      case 'playlist_add':
        return <Music className="w-5 h-5" />
      case 'playlist_remove':
        return <X className="w-5 h-5" />
      case 'fan_spike':
        return <Users className="w-5 h-5" />
      case 'engagement_crash':
        return <MessageCircle className="w-5 h-5" />
      case 'best_time_post':
        return <Clock className="w-5 h-5" />
    }
  }

  const getAlertColor = (priority: AlertPriority) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-600 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
        }
      case 'high':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-600 dark:text-orange-400',
          badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
        }
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-600 dark:text-yellow-400',
          badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
        }
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
        }
    }
  }

  const getConfidenceBadge = (level: ConfidenceLevel, score: number) => {
    const badges = {
      high: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
      medium: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
      low: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${badges[level]}`}>
        {score}% confiance
      </span>
    )
  }

  const filteredAlerts = alerts.filter(alert => {
    if (!showDismissed && alert.isDismissed) return false
    if (filterType !== 'all' && alert.type !== filterType) return false
    if (filterPriority !== 'all' && alert.priority !== filterPriority) return false
    return true
  })

  const stats = {
    total: alerts.filter(a => !a.isDismissed).length,
    unread: alerts.filter(a => !a.isRead && !a.isDismissed).length,
    critical: alerts.filter(a => a.priority === 'critical' && !a.isDismissed).length,
    high: alerts.filter(a => a.priority === 'high' && !a.isDismissed).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Smart Alerts
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Alertes intelligentes avec ML baselines dynamiques
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showDismissed
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
            }`}
          >
            {showDismissed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unread</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.unread}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
            </div>
            <Flame className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">High Priority</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.high}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AlertType | 'all')}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="viral_spike">🔥 Viral Spike</option>
            <option value="momentum_drop">📉 Momentum Drop</option>
            <option value="playlist_add">🎵 Playlist Add</option>
            <option value="playlist_remove">❌ Playlist Remove</option>
            <option value="fan_spike">👥 Fan Spike</option>
            <option value="engagement_crash">💬 Engagement Crash</option>
            <option value="best_time_post">⏰ Best Time Post</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as AlertPriority | 'all')}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Alerts
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Everything looks good! ML monitoring is active.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const colors = getAlertColor(alert.priority)
            const isExpanded = expandedAlertId === alert.id

            return (
              <div
                key={alert.id}
                className={`
                  bg-white dark:bg-gray-900 rounded-xl border-2 transition-all
                  ${alert.isRead ? 'opacity-70' : ''}
                  ${colors.border}
                `}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <span className={colors.text}>
                          {getAlertIcon(alert.type)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors.badge}`}>
                            {alert.priority}
                          </span>
                          {getConfidenceBadge(alert.confidenceLevel, alert.confidence)}
                          {!alert.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {alert.title}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {alert.artistName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => alert.isDismissed ? handleRestore(alert.id) : handleDismiss(alert.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                      {/* Baseline Comparison */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          ML BASELINE ANALYSIS
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {alert.baseline.current.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Baseline (90d median)</p>
                            <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                              {alert.baseline.baseline.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Change</p>
                            <p className={`text-lg font-bold ${alert.baseline.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {alert.baseline.change > 0 ? '+' : ''}{alert.baseline.change}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ML Insights */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                          🧠 ML Insights
                        </p>
                        <ul className="space-y-1">
                          {alert.mlInsights.map((insight, idx) => (
                            <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          {alert.actions.primary}
                        </button>
                        {alert.actions.secondary && (
                          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 font-medium">
                            {alert.actions.secondary}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
              Smart Alerting with ML
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Contrairement aux alertes classiques avec seuils fixes, FanPulse utilise des <strong>baselines dynamiques par artiste</strong> et du <strong>ML anomaly detection</strong> (Isolation Forest). Chaque alerte a un score de confiance et est validée par l'IA avant envoi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mock Data
const mockAlerts: SmartAlert[] = [
  {
    id: '1',
    type: 'viral_spike',
    priority: 'critical',
    title: 'Viral Spike Detected',
    message: 'Your track "New Song" gained 12,500 streams in the last 6 hours (+340% vs baseline). TikTok usage up 520%.',
    artistId: 'drake-123',
    artistName: 'Drake',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    confidence: 96,
    confidenceLevel: 'high',
    baseline: {
      metric: 'Streams (6h window)',
      current: 12500,
      baseline: 3000,
      change: 340
    },
    mlInsights: [
      'Anomaly score: 0.94 (very high deviation)',
      'Pattern matches viral spikes from 230+ similar cases',
      'TikTok influencer posts detected (3 videos, 2M combined views)',
      'Window of opportunity: ~8 hours before momentum peaks'
    ],
    actions: {
      primary: 'Post Now on Instagram',
      secondary: 'View TikTok Analytics'
    },
    isRead: false,
    isDismissed: false
  },
  {
    id: '2',
    type: 'momentum_drop',
    priority: 'high',
    title: 'Momentum Drop Alert',
    message: 'Momentum index declined 23% in last 7 days (87 → 67). Investigate immediately.',
    artistId: 'maya-456',
    artistName: 'Maya Rivers',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    confidence: 89,
    confidenceLevel: 'high',
    baseline: {
      metric: 'Momentum Index',
      current: 67,
      baseline: 87,
      change: -23
    },
    mlInsights: [
      'Downward trend confirmed (5/7 days declining)',
      'Save rate dropped to 1.8% (below 2.5% baseline)',
      'Engagement rate down 35% vs 30-day average',
      'Playlist removals detected: 3 algorithmic playlists'
    ],
    actions: {
      primary: 'Review Content Strategy',
      secondary: 'Contact Label'
    },
    isRead: false,
    isDismissed: false
  },
  {
    id: '3',
    type: 'best_time_post',
    priority: 'medium',
    title: 'Best Time to Post - Now!',
    message: 'Your audience is 3x more active in the next 2 hours (18h-20h). Peak engagement window.',
    artistId: 'alex-789',
    artistName: 'Alex Laurent',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    confidence: 78,
    confidenceLevel: 'medium',
    baseline: {
      metric: 'Audience Activity',
      current: 7200,
      baseline: 2400,
      change: 200
    },
    mlInsights: [
      'Historical analysis: posts at this time perform 2.3x better',
      '73% of your audience currently online (vs 25% average)',
      'Low competition: competitors posting down 40%',
      'Optimal window closes in 2 hours'
    ],
    actions: {
      primary: 'Post Now',
      secondary: 'Schedule for 18h30'
    },
    isRead: true,
    isDismissed: false
  },
  {
    id: '4',
    type: 'playlist_add',
    priority: 'medium',
    title: 'Added to "Indie Gems"',
    message: 'Your track was added to "Indie Gems" playlist (50K followers). Estimated +200 streams/day.',
    artistId: 'sophie-012',
    artistName: 'Sophie Martin',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    confidence: 92,
    confidenceLevel: 'high',
    baseline: {
      metric: 'Daily Streams',
      current: 1200,
      baseline: 1000,
      change: 20
    },
    mlInsights: [
      'Playlist type: Editorial (higher quality signal)',
      'Average playlist follower engagement: 8.2%',
      'Similar artists saw +180-250 streams/day from this playlist',
      'Momentum boost likely within 24-48 hours'
    ],
    actions: {
      primary: 'Thank Curator',
      secondary: 'Monitor Impact'
    },
    isRead: true,
    isDismissed: false
  }
]
