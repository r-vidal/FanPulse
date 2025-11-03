/**
 * FVS Display Component
 *
 * Shows Fan Value Score with detailed breakdown
 */

'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import type { FVSData } from '@/lib/api/analytics'

interface FVSDisplayProps {
  data: FVSData
}

export function FVSDisplay({ data }: FVSDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Average'
    return 'Needs Improvement'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fan Value Score (FVS)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${getScoreColor(data.fvs)}`}>
              {data.fvs.toFixed(1)}
            </span>
            <span className="text-gray-500">/ 100</span>
          </div>
          <p className={`mt-1 text-sm font-medium ${getScoreColor(data.fvs)}`}>
            {getScoreLabel(data.fvs)}
          </p>
        </div>

        <div className="space-y-4">
          {/* Engagement */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Engagement
              </span>
              <span className="text-sm text-gray-600">
                {data.breakdown.engagement.score.toFixed(1)}
                <span className="text-gray-400 ml-1">
                  (40% weight)
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${data.breakdown.engagement.score}%` }}
              />
            </div>
          </div>

          {/* Growth */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Growth
              </span>
              <span className="text-sm text-gray-600">
                {data.breakdown.growth.score.toFixed(1)}
                <span className="text-gray-400 ml-1">
                  (30% weight)
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${data.breakdown.growth.score}%` }}
              />
            </div>
          </div>

          {/* Reach */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Reach
              </span>
              <span className="text-sm text-gray-600">
                {data.breakdown.reach.score.toFixed(1)}
                <span className="text-gray-400 ml-1">
                  (20% weight)
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${data.breakdown.reach.score}%` }}
              />
            </div>
          </div>

          {/* Conversion */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Conversion
              </span>
              <span className="text-sm text-gray-600">
                {data.breakdown.conversion.score.toFixed(1)}
                <span className="text-gray-400 ml-1">
                  (10% weight)
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${data.breakdown.conversion.score}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            FVS measures the overall value of your fanbase across engagement,
            growth, reach, and conversion. Higher scores indicate a more valuable
            and engaged audience.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
