/**
 * MomentumBreakdown Component
 *
 * Shows the breakdown of momentum signals with progress bars
 */

import { MomentumSignals } from '@/lib/api/momentum'
import { Users, TrendingUp, Music } from 'lucide-react'

interface MomentumBreakdownProps {
  signals: MomentumSignals
}

interface SignalConfig {
  label: string
  icon: any
  color: string
  barColor: string
  weight: number
}

const SIGNAL_CONFIG: Record<string, SignalConfig> = {
  popularity: {
    label: 'Popularity',
    icon: TrendingUp,
    color: 'text-purple-600',
    barColor: 'bg-purple-600',
    weight: 40
  },
  follower_growth: {
    label: 'Follower Growth',
    icon: Users,
    color: 'text-blue-600',
    barColor: 'bg-blue-600',
    weight: 30
  },
  top_tracks: {
    label: 'Top Tracks',
    icon: Music,
    color: 'text-green-600',
    barColor: 'bg-green-600',
    weight: 30
  }
}

export default function MomentumBreakdown({ signals }: MomentumBreakdownProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Signal Breakdown
        </h3>
        <p className="text-sm text-gray-600">
          Momentum is calculated from multiple signals, each weighted differently
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(signals).map(([key, value]) => {
          const config = SIGNAL_CONFIG[key]
          if (!config) return null

          const Icon = config.icon
          const percentage = (value / 10) * 100

          return (
            <div key={key} className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <span className="font-medium text-gray-900">{config.label}</span>
                  <span className="text-xs text-gray-500">({config.weight}% weight)</span>
                </div>
                <span className="font-bold text-gray-900">{value.toFixed(1)}/10</span>
              </div>

              {/* Progress bar */}
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.barColor} transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">How it works</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Popularity (40%):</strong> Spotify popularity score (0-100)</li>
          <li>• <strong>Follower Growth (30%):</strong> Follower increase trend</li>
          <li>• <strong>Top Tracks (30%):</strong> Performance of top tracks</li>
        </ul>
      </div>
    </div>
  )
}
