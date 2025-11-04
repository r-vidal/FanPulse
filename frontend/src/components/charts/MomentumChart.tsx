'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { format } from 'date-fns'

export interface MomentumHistoryPoint {
  date: string
  score: number
  status: 'fire' | 'growing' | 'stable' | 'declining'
}

interface MomentumChartProps {
  data: MomentumHistoryPoint[]
  height?: number
}

export const MomentumChart: React.FC<MomentumChartProps> = ({ data, height = 400 }) => {
  // Transform data for recharts
  const chartData = data.map(point => ({
    date: point.date,
    score: point.score,
    status: point.status,
    formattedDate: format(new Date(point.date), 'MMM dd')
  }))

  // Get color based on current momentum status
  const getLineColor = () => {
    if (!data || data.length === 0) return '#6B7280'
    const latestStatus = data[data.length - 1].status

    switch (latestStatus) {
      case 'fire':
        return '#EF4444' // Red
      case 'growing':
        return '#10B981' // Green
      case 'stable':
        return '#3B82F6' // Blue
      case 'declining':
        return '#F59E0B' // Orange
      default:
        return '#6B7280' // Gray
    }
  }

  // Get gradient color based on status
  const getGradientId = () => {
    if (!data || data.length === 0) return 'colorDefault'
    const latestStatus = data[data.length - 1].status
    return `color${latestStatus.charAt(0).toUpperCase() + latestStatus.slice(1)}`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {format(new Date(data.date), 'MMMM dd, yyyy')}
          </p>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`} />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {data.score.toFixed(1)}/10
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {data.status} Momentum
          </p>
        </div>
      )
    }
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fire':
        return 'bg-red-500'
      case 'growing':
        return 'bg-green-500'
      case 'stable':
        return 'bg-blue-500'
      case 'declining':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No momentum data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Data will appear as it's collected
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorFire" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorGrowing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorStable" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorDeclining" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
          <XAxis
            dataKey="formattedDate"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke={getLineColor()}
            strokeWidth={3}
            fill={`url(#${getGradientId()})`}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Fire (8-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Growing (6-8)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Stable (4-6)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Declining (0-4)</span>
        </div>
      </div>
    </div>
  )
}
