/**
 * ActionCard Component
 *
 * Displays a single action with all details and action buttons
 */

import { AlertCircle, Zap, TrendingUp, CheckCircle, Check, Clock, X } from 'lucide-react'
import { NextAction, URGENCY_CONFIG, STATUS_CONFIG } from '@/types/actions'

interface ActionCardProps {
  action: NextAction
  onComplete?: (actionId: string) => void
  onSnooze?: (actionId: string) => void
  onIgnore?: (actionId: string) => void
  onViewArtist?: (artistId: string) => void
}

export default function ActionCard({
  action,
  onComplete,
  onSnooze,
  onIgnore,
  onViewArtist
}: ActionCardProps) {
  const urgencyConfig = URGENCY_CONFIG[action.urgency]
  const statusConfig = STATUS_CONFIG[action.status]

  const getIcon = () => {
    switch (action.urgency) {
      case 'critical':
        return <AlertCircle className={`w-6 h-6 ${urgencyConfig.iconColorClass}`} />
      case 'high':
        return <Zap className={`w-6 h-6 ${urgencyConfig.iconColorClass}`} />
      case 'medium':
        return <TrendingUp className={`w-6 h-6 ${urgencyConfig.iconColorClass}`} />
      default:
        return <CheckCircle className={`w-6 h-6 ${urgencyConfig.iconColorClass}`} />
    }
  }

  return (
    <div
      className={`rounded-lg shadow-lg p-6 border-l-4 ${urgencyConfig.bgClass} ${urgencyConfig.borderClass} transition-all hover:shadow-xl`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-full ${urgencyConfig.iconBgClass} flex-shrink-0`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">{action.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${urgencyConfig.badgeClass}`}>
                {action.urgency}
              </span>
              {action.status !== 'pending' && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badgeClass}`}>
                  {statusConfig.label}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 mb-3">{action.description}</p>

          {/* Reason */}
          {action.reason && (
            <div className="mb-3 p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong className="text-gray-900">Why:</strong> {action.reason}
              </p>
            </div>
          )}

          {/* Expected Impact */}
          {action.expected_impact && (
            <div className="mb-4 p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong className="text-gray-900">Expected Impact:</strong> {action.expected_impact}
              </p>
            </div>
          )}

          {/* Artist Info */}
          <button
            onClick={() => onViewArtist?.(action.artist_id)}
            className="text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
          >
            For: <strong>{action.artist_name}</strong> →
          </button>

          {/* Action Buttons */}
          {action.status === 'pending' && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onComplete?.(action.id)}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold text-white transition-colors ${urgencyConfig.buttonClass}`}
              >
                <Check className="w-4 h-4 mr-2" />
                Mark Complete
              </button>
              <button
                onClick={() => onSnooze?.(action.id)}
                className="inline-flex items-center px-4 py-2 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Clock className="w-4 h-4 mr-2" />
                Snooze
              </button>
              <button
                onClick={() => onIgnore?.(action.id)}
                className="inline-flex items-center px-4 py-2 rounded-lg font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Ignore
              </button>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Created: {new Date(action.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              {action.completed_at && (
                <span className="ml-3">
                  Completed: {new Date(action.completed_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
