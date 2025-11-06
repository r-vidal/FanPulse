'use client'

import { useState } from 'react'
import { mockRevenueForecast, RevenueForecast as RevenueForecastType } from '@/lib/mockData'
import { DollarSign, TrendingUp, TrendingDown, Music, Mic, ShoppingBag, Radio, Info } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts'

/**
 * Revenue Forecasting Dashboard
 * 3-12 month revenue projections across all revenue streams
 * Mock data: GET /api/analytics/{artist_id}/revenue-forecast
 */
export default function RevenueForecast({ artistId }: { artistId?: string }) {
  const [timeRange, setTimeRange] = useState<3 | 6 | 12>(12)
  const [data] = useState<RevenueForecastType>(mockRevenueForecast(timeRange))

  const revenueStreams = [
    {
      name: 'Streaming',
      icon: Music,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      ...data.breakdown.streaming,
    },
    {
      name: 'Concerts',
      icon: Mic,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      ...data.breakdown.concerts,
    },
    {
      name: 'Merchandise',
      icon: ShoppingBag,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      ...data.breakdown.merch,
    },
    {
      name: 'Sync/Licensing',
      icon: Radio,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      ...data.breakdown.sync,
    },
  ]

  // Prepare chart data
  const chartData = Array.from({ length: timeRange }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() + i)

    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      streaming: data.breakdown.streaming.monthly[i] || 0,
      concerts: data.breakdown.concerts.monthly[i] || 0,
      merch: data.breakdown.merch.monthly[i] || 0,
      sync: data.breakdown.sync.monthly[i] || 0,
      total: (data.breakdown.streaming.monthly[i] || 0) +
             (data.breakdown.concerts.monthly[i] || 0) +
             (data.breakdown.merch.monthly[i] || 0) +
             (data.breakdown.sync.monthly[i] || 0),
    }
  })

  // Scenario comparison data
  const scenarioData = [
    {
      scenario: 'Pessimistic',
      value: data.scenarios.pessimistic,
      fill: '#EF4444',
    },
    {
      scenario: 'Realistic',
      value: data.scenarios.realistic,
      fill: '#3B82F6',
    },
    {
      scenario: 'Optimistic',
      value: data.scenarios.optimistic,
      fill: '#10B981',
    },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Revenue Forecasting</h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered {timeRange}-month revenue projections across all streams
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[3, 6, 12].map((months) => (
            <button
              key={months}
              onClick={() => setTimeRange(months as 3 | 6 | 12)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === months
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {months}M
            </button>
          ))}
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 dark:bg-blue-500 rounded-full">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Projected Revenue ({timeRange} months)</p>
            <p className="text-5xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.total)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 rounded-full text-sm font-semibold text-blue-700 dark:text-blue-300">
                Realistic Scenario
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Streams Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueStreams.map((stream) => {
          const Icon = stream.icon
          const avgMonthly = Math.round(stream.total / timeRange)

          return (
            <div
              key={stream.name}
              className={`rounded-xl border border-gray-200 dark:border-gray-800 ${stream.bgColor} p-6`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg">
                  <Icon className={`w-5 h-5 ${stream.color}`} />
                </div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{stream.name}</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stream.total)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Avg/Month</p>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {formatCurrency(avgMonthly)}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {stream.trend >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-sm font-semibold ${
                    stream.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stream.trend >= 0 ? '+' : ''}{stream.trend}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">growth</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stacked Area Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Revenue Breakdown Over Time</h3>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorStreaming" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorConcerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorMerch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSync" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="streaming"
                stackId="1"
                stroke="#10B981"
                fill="url(#colorStreaming)"
                name="Streaming"
              />
              <Area
                type="monotone"
                dataKey="concerts"
                stackId="1"
                stroke="#3B82F6"
                fill="url(#colorConcerts)"
                name="Concerts"
              />
              <Area
                type="monotone"
                dataKey="merch"
                stackId="1"
                stroke="#8B5CF6"
                fill="url(#colorMerch)"
                name="Merchandise"
              />
              <Area
                type="monotone"
                dataKey="sync"
                stackId="1"
                stroke="#F59E0B"
                fill="url(#colorSync)"
                name="Sync/Licensing"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scenarios Comparison */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Scenario Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Compare best, realistic, and worst-case projections</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-900 dark:text-blue-300">±30% variance</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">Pessimistic (-30%)</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(data.scenarios.pessimistic)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              If engagement drops and market conditions worsen
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-xl">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Realistic (Base)</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(data.scenarios.realistic)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Most likely outcome based on current trends
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">Optimistic (+30%)</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(data.scenarios.optimistic)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              With viral growth and successful releases
            </p>
          </div>
        </div>

        {/* Bar Chart Comparison */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="scenario"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {scenarioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Breakdown</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Streaming
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Concerts
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Merchandise
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Sync
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {chartData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {row.fullDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(row.streaming)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(row.concerts)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(row.merch)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(row.sync)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 dark:bg-gray-800 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                  {formatCurrency(data.breakdown.streaming.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                  {formatCurrency(data.breakdown.concerts.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                  {formatCurrency(data.breakdown.merch.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                  {formatCurrency(data.breakdown.sync.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                  {formatCurrency(data.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">Key Insights</h3>
        <ul className="space-y-2">
          {data.insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <span className="text-sm text-blue-800 dark:text-blue-200">{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock data.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/analytics/{'{artist_id}'}/revenue-forecast
          </code> for real-time projections.
        </p>
      </div>
    </div>
  )
}
