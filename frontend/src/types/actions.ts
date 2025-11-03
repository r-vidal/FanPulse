/**
 * Action Types & Interfaces
 */

export type ActionUrgency = 'critical' | 'high' | 'medium' | 'low'
export type ActionStatus = 'pending' | 'completed' | 'snoozed' | 'ignored'

export interface NextAction {
  id: string
  artist_id: string
  artist_name: string
  action_type: string
  title: string
  description: string
  urgency: ActionUrgency
  reason: string | null
  expected_impact: string | null
  status: ActionStatus
  created_at: string
  completed_at: string | null
}

export interface ActionFilters {
  urgency?: ActionUrgency
  status?: ActionStatus
  artistId?: string
  search?: string
}

export const URGENCY_CONFIG = {
  critical: {
    color: 'red',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-500',
    badgeClass: 'bg-red-200 text-red-800',
    buttonClass: 'bg-red-600 hover:bg-red-700',
    iconBgClass: 'bg-red-100',
    iconColorClass: 'text-red-600',
    label: 'Critical'
  },
  high: {
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-500',
    badgeClass: 'bg-orange-200 text-orange-800',
    buttonClass: 'bg-orange-600 hover:bg-orange-700',
    iconBgClass: 'bg-orange-100',
    iconColorClass: 'text-orange-600',
    label: 'High'
  },
  medium: {
    color: 'yellow',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-500',
    badgeClass: 'bg-yellow-200 text-yellow-800',
    buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
    iconBgClass: 'bg-yellow-100',
    iconColorClass: 'text-yellow-600',
    label: 'Medium'
  },
  low: {
    color: 'blue',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-500',
    badgeClass: 'bg-blue-200 text-blue-800',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
    iconBgClass: 'bg-blue-100',
    iconColorClass: 'text-blue-600',
    label: 'Low'
  }
} as const

export const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'gray',
    badgeClass: 'bg-gray-200 text-gray-800'
  },
  completed: {
    label: 'Completed',
    color: 'green',
    badgeClass: 'bg-green-200 text-green-800'
  },
  snoozed: {
    label: 'Snoozed',
    color: 'purple',
    badgeClass: 'bg-purple-200 text-purple-800'
  },
  ignored: {
    label: 'Ignored',
    color: 'gray',
    badgeClass: 'bg-gray-300 text-gray-600'
  }
} as const
