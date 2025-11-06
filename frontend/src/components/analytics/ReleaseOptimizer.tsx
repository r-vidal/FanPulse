'use client'

import { useState } from 'react'
import { mockReleaseOptimization } from '@/lib/mockData'
import { Calendar, Clock, Target, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'

/**
 * Release Optimizer
 * Predicts optimal day/time to release a single
 * Mock data: POST /api/releases/optimize
 */
export default function ReleaseOptimizer({ artistId }: { artistId?: string }) {
  const [data] = useState(mockReleaseOptimization())

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Release Optimizer</h2>
        <p className="text-gray-600 dark:text-gray-400">AI-predicted optimal release timing</p>
      </div>

      {/* Optimal Recommendation */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-full">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Optimal Release Window</h3>
            <div className="flex items-baseline gap-4 mb-4">
              <div>
                <Calendar className="w-5 h-5 inline text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {new Date(data.optimalDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div>
                <Clock className="w-5 h-5 inline text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-2xl font-bold text-blue-900 dark:text-blue-300">{data.optimalTime}</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-900 dark:text-green-300">{data.confidenceScore}% Confidence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Why This Time?</h3>
        <ul className="space-y-3">
          {data.reasoning.map((reason, i) => (
            <li key={i} className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Release Timing Heatmap</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-xs font-medium text-gray-600 dark:text-gray-400 pb-2"></th>
                {hours.map(hour => (
                  <th key={hour} className="text-xs font-medium text-gray-600 dark:text-gray-400 pb-2 px-1">
                    {hour}h
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => (
                <tr key={day}>
                  <td className="text-xs font-medium text-gray-600 dark:text-gray-400 pr-3">{day}</td>
                  {hours.map(hour => {
                    const cell = data.heatmap.find(h => h.day === day && h.hour === hour)
                    const score = cell?.score || 0
                    const opacity = score / 100
                    return (
                      <td key={hour} className="p-1">
                        <div
                          className="w-full h-8 rounded"
                          style={{
                            backgroundColor: score >= 85 ? `rgba(34, 197, 94, ${opacity})` :
                                           score >= 70 ? `rgba(59, 130, 246, ${opacity})` :
                                           `rgba(156, 163, 175, ${opacity})`
                          }}
                          title={`${day} ${hour}:00 - Score: ${score}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Optimal (85-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span>Good (70-84)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded" />
            <span>Average (&lt;70)</span>
          </div>
        </div>
      </div>

      {/* Alternatives */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alternative Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.alternatives.map((alt, i) => (
            <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                {new Date(alt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {alt.time}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Score: {alt.score}/100</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conflicts */}
      {data.conflicts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Potential Conflicts</h4>
              <ul className="space-y-1">
                {data.conflicts.map((conflict, i) => (
                  <li key={i} className="text-sm text-yellow-800 dark:text-yellow-200">• {conflict}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
