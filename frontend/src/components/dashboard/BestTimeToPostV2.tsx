'use client'

/**
 * BestTimeToPostV2 - Heatmap suggestions horaires optimales
 * Affiche une heatmap jour/heure basée sur l'engagement historique
 */

import { useState, useEffect } from 'react'
import { Clock, TrendingUp, Sparkles } from 'lucide-react'
import { socialApi } from '@/lib/api/social'

interface TimeSlot {
  day: number // 0-6 (Sunday-Saturday)
  hour: number // 0-23
  score: number // 0-100
}

interface BestTime {
  day: string
  hour: string
  score: number
}

export function BestTimeToPostV2() {
  const [heatmapData, setHeatmapData] = useState<TimeSlot[]>([])
  const [bestTimes, setBestTimes] = useState<BestTime[]>([])
  const [loading, setLoading] = useState(true)

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am']

  useEffect(() => {
    loadBestTimes()
  }, [])

  const loadBestTimes = async () => {
    try {
      setLoading(true)

      // Fetch data from API
      const response = await socialApi.getOptimalTimes()

      // Transform API data to heatmap format
      const dayMap: Record<string, number> = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      }

      const heatmap: TimeSlot[] = response.optimal_times.map(slot => ({
        day: dayMap[slot.day.toLowerCase()],
        hour: slot.hour,
        score: slot.engagement_score
      }))

      // Get top 3 best times
      const top3 = response.optimal_times.slice(0, 3).map(slot => {
        const hourStr = slot.hour >= 12
          ? `${slot.hour === 12 ? 12 : slot.hour - 12}:00 PM`
          : `${slot.hour === 0 ? 12 : slot.hour}:00 AM`

        return {
          day: slot.day,
          hour: hourStr,
          score: slot.engagement_score
        }
      })

      setHeatmapData(heatmap)
      setBestTimes(top3)
    } catch (error) {
      console.error('Failed to load best times:', error)
      setHeatmapData([])
      setBestTimes([])
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500 dark:bg-green-600'
    if (score >= 60) return 'bg-blue-500 dark:bg-blue-600'
    if (score >= 40) return 'bg-yellow-500 dark:bg-yellow-600'
    return 'bg-gray-300 dark:bg-gray-700'
  }

  const getScoreOpacity = (score: number): string => {
    if (score >= 80) return 'opacity-100'
    if (score >= 60) return 'opacity-75'
    if (score >= 40) return 'opacity-50'
    return 'opacity-30'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Best Time to Post</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Optimal posting times based on your audience engagement
        </p>
      </div>

      {/* Top 3 Best Times */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {bestTimes.map((time, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-1 mb-1">
              {index === 0 && <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />}
              {index === 1 && <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">#{index + 1}</span>
            </div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {time.day}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {time.hour}
            </div>
            <div className="mt-1">
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(time.score)}`}
                    style={{ width: `${time.score}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {time.score}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-12 flex-shrink-0"></div>
            {hours.map((hour, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {hour}
                </span>
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-2">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="flex items-center">
                {/* Day label */}
                <div className="w-12 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {day}
                  </span>
                </div>

                {/* Hour cells */}
                <div className="flex-1 flex gap-1">
                  {hours.map((_, hourIndex) => {
                    const actualHour = 6 + hourIndex * 3
                    const slot = heatmapData.find(
                      s => s.day === dayIndex && s.hour === actualHour
                    )
                    const score = slot?.score || 0

                    return (
                      <div
                        key={hourIndex}
                        className={`
                          flex-1 h-8 rounded transition-all cursor-pointer
                          hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500
                          ${getScoreColor(score)} ${getScoreOpacity(score)}
                        `}
                        title={`${day} ${actualHour}:00 - Score: ${Math.round(score)}`}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-700 opacity-30"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500 dark:bg-yellow-600 opacity-50"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600 opacity-75"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-600 opacity-100"></div>
              <span>Peak</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
