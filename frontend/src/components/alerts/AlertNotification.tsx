'use client'

import { useEffect } from 'react'
import { X, Zap, TrendingUp, Target, Trophy, AlertTriangle } from 'lucide-react'
import type { Opportunity } from '@/types'

interface AlertNotificationProps {
  alert: Opportunity | null
  onClose: () => void
}

const AlertNotification = ({ alert, onClose }: AlertNotificationProps) => {
  useEffect(() => {
    if (alert) {
      // Auto-close after 10 seconds
      const timeout = setTimeout(onClose, 10000)
      return () => clearTimeout(timeout)
    }
  }, [alert, onClose])

  if (!alert) return null

  const getIcon = (type: Opportunity['type']) => {
    switch (type) {
      case 'viral_growth':
        return <Zap className="w-6 h-6" />
      case 'momentum_spike':
        return <TrendingUp className="w-6 h-6" />
      case 'plateau_break':
        return <Target className="w-6 h-6" />
      case 'milestone':
        return <Trophy className="w-6 h-6" />
      default:
        return <AlertTriangle className="w-6 h-6" />
    }
  }

  const getStyles = (priority: Opportunity['priority']) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          icon: 'text-red-600',
          text: 'text-red-900',
        }
      case 'high':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-500',
          icon: 'text-orange-600',
          text: 'text-orange-900',
        }
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          icon: 'text-yellow-600',
          text: 'text-yellow-900',
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          icon: 'text-blue-600',
          text: 'text-blue-900',
        }
    }
  }

  const styles = getStyles(alert.priority)

  return (
    <div
      className={`fixed top-20 right-4 max-w-md w-full ${styles.bg} border-2 ${styles.border} rounded-lg shadow-2xl p-4 animate-slide-in z-50`}
    >
      <div className="flex items-start gap-3">
        <div className={styles.icon}>{getIcon(alert.type)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className={`font-bold ${styles.text}`}>{alert.title}</h4>
            <button
              onClick={onClose}
              className={`${styles.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className={`text-sm ${styles.text} mb-2`}>{alert.message}</p>

          <p className="text-xs text-gray-600">
            Artist: <strong>{alert.artist_name}</strong>
          </p>

          {alert.recommended_actions && alert.recommended_actions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-xs font-semibold text-gray-700 mb-1">Recommended Actions:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {alert.recommended_actions.slice(0, 2).map((action, idx) => (
                  <li key={idx}>• {action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertNotification
