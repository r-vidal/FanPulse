/**
 * Momentum Display Component
 *
 * Shows Momentum Index with status and breakdown
 */

'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import type { MomentumData } from '@/lib/api/analytics'

interface MomentumDisplayProps {
  data: MomentumData
}

export function MomentumDisplay({ data }: MomentumDisplayProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'viral':
      case 'rapid_growth':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'growing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'stable':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'declining':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'viral':
        return '🔥 Viral / Breakout'
      case 'rapid_growth':
        return '📈 Rapid Growth'
      case 'growing':
        return '⬆️ Growing'
      case 'stable':
        return '➡️ Stable'
      case 'declining':
        return '⬇️ Declining'
      default:
        return status
    }
  }

  const getMomentumColor = (momentum: number) => {
    if (momentum >= 9) return 'text-green-600'
    if (momentum >= 7) return 'text-blue-600'
    if (momentum >= 5) return 'text-yellow-600'
    if (momentum >= 3) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Momentum Index</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-5xl font-bold ${getMomentumColor(data.momentum_index)}`}>
              {data.momentum_index.toFixed(1)}
            </span>
            <span className="text-gray-500">/ 10</span>
          </div>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(data.status)}`}
          >
            {getStatusLabel(data.status)}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Velocity</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(data.breakdown.velocity / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-8">
                {data.breakdown.velocity.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Acceleration</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(data.breakdown.acceleration / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-8">
                {data.breakdown.acceleration.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Consistency</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(data.breakdown.consistency / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-8">
                {data.breakdown.consistency.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Viral Potential</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: `${(data.breakdown.viral_potential / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-8">
                {data.breakdown.viral_potential.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Momentum Index tracks growth velocity and trajectory. Higher scores
            indicate accelerating growth and viral potential.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
