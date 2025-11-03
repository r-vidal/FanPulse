/**
 * MomentumBadge Component
 *
 * Displays momentum status with appropriate styling
 */

import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react'

interface MomentumBadgeProps {
  status: 'fire' | 'growing' | 'stable' | 'declining'
  score: number
  size?: 'sm' | 'md' | 'lg'
}

const STATUS_CONFIG = {
  fire: {
    label: 'Fire',
    icon: Flame,
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    borderClass: 'border-red-300',
    iconColor: 'text-red-600'
  },
  growing: {
    label: 'Growing',
    icon: TrendingUp,
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
    borderClass: 'border-green-300',
    iconColor: 'text-green-600'
  },
  stable: {
    label: 'Stable',
    icon: Minus,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-300',
    iconColor: 'text-blue-600'
  },
  declining: {
    label: 'Declining',
    icon: TrendingDown,
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-300',
    iconColor: 'text-orange-600'
  }
}

const SIZE_CLASSES = {
  sm: {
    container: 'px-3 py-1',
    text: 'text-xs',
    icon: 'w-3 h-3'
  },
  md: {
    container: 'px-4 py-2',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  lg: {
    container: 'px-6 py-3',
    text: 'text-base',
    icon: 'w-5 h-5'
  }
}

export default function MomentumBadge({ status, score, size = 'md' }: MomentumBadgeProps) {
  const config = STATUS_CONFIG[status]
  const sizeClass = SIZE_CLASSES[size]
  const Icon = config.icon

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClass.container}`}
    >
      <Icon className={`${sizeClass.icon} ${config.iconColor}`} />
      <span className={`font-semibold ${sizeClass.text}`}>
        {config.label}
      </span>
      <span className={`font-bold ${sizeClass.text}`}>
        {score.toFixed(1)}/10
      </span>
    </div>
  )
}
