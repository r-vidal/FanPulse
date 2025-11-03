'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { forecastsApi } from '@/lib/api/forecasts'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Download,
  RefreshCw,
} from 'lucide-react'
import type { RevenueForecastResponse } from '@/types'

interface Artist {
  id: string
  name: string
}

export default function ForecastsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedArtist, setSelectedArtist] = useState<string>('')
  const [months, setMonths] = useState(12)
  const [forecast, setForecast] = useState<RevenueForecastResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArtists()
  }, [])

  const fetchArtists = async () => {
    try {
      const response = await api.get('/api/artists/')
      setArtists(response.data)
      if (response.data.length > 0) {
        setSelectedArtist(response.data[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch artists:', err)
      setError('Failed to load artists')
    }
  }

  const handleFetchForecast = async () => {
    if (!selectedArtist) return

    try {
      setLoading(true)
      setError(null)
      const data = await forecastsApi.getForecast(selectedArtist, months)
      setForecast(data)
    } catch (err: any) {
      console.error('Failed to fetch forecast:', err)
      setError(err.response?.data?.detail || 'Failed to load forecast')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateForecast = async () => {
    if (!selectedArtist) return

    try {
      setGenerating(true)
      setError(null)
      const data = await forecastsApi.generateForecast(selectedArtist, months)
      setForecast(data)
    } catch (err: any) {
      console.error('Failed to generate forecast:', err)
      setError(err.response?.data?.detail || 'Failed to generate forecast')
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = async () => {
    if (!selectedArtist) return

    try {
      const blob = await forecastsApi.exportForecast(selectedArtist)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `forecast_${selectedArtist}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Failed to export:', err)
      alert('Failed to export data')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-6 h-6 text-green-600" />
      case 'decreasing':
        return <TrendingDown className="w-6 h-6 text-red-600" />
      default:
        return <Minus className="w-6 h-6 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600 bg-green-50'
      case 'decreasing':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Prepare chart data
  const chartData = forecast?.forecasts.map((f) => ({
    period: f.forecast_period,
    Conservative: f.conservative,
    Realistic: f.realistic,
    Optimistic: f.optimistic,
  })) || []

  // Prepare breakdown data (average across all months)
  const breakdownData = forecast
    ? [
        {
          name: 'Streaming',
          value: forecast.forecasts.reduce((sum, f) => sum + f.breakdown.streaming, 0) / forecast.forecasts.length,
        },
        {
          name: 'Concerts',
          value: forecast.forecasts.reduce((sum, f) => sum + f.breakdown.concerts, 0) / forecast.forecasts.length,
        },
        {
          name: 'Merchandise',
          value: forecast.forecasts.reduce((sum, f) => sum + f.breakdown.merchandise, 0) / forecast.forecasts.length,
        },
        {
          name: 'Sponsorships',
          value: forecast.forecasts.reduce((sum, f) => sum + f.breakdown.sponsorships, 0) / forecast.forecasts.length,
        },
        {
          name: 'Other',
          value: forecast.forecasts.reduce((sum, f) => sum + f.breakdown.other, 0) / forecast.forecasts.length,
        },
      ]
    : []

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Revenue Forecasting</h2>
            <p className="mt-2 text-gray-600">
              ML-based revenue predictions with 3 scenarios (Conservative, Realistic, Optimistic)
            </p>
          </div>

          {/* Configuration Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Forecast</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Artist Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Artist
                </label>
                <select
                  value={selectedArtist}
                  onChange={(e) => setSelectedArtist(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Forecast Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forecast Period (Months)
                </label>
                <select
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleFetchForecast}
                disabled={loading || !selectedArtist}
                className="flex-1"
                variant="secondary"
              >
                {loading ? 'Loading...' : 'Load Forecast'}
              </Button>
              <Button
                onClick={handleGenerateForecast}
                disabled={generating || !selectedArtist}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating...' : 'Generate New Forecast'}
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Results */}
          {forecast && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Trend Card */}
                <div className={`rounded-lg shadow p-6 ${getTrendColor(forecast.trend)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Trend</span>
                    {getTrendIcon(forecast.trend)}
                  </div>
                  <p className="text-2xl font-bold capitalize">{forecast.trend}</p>
                </div>

                {/* Conservative Total */}
                <div className="bg-red-50 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">Conservative</span>
                    <DollarSign className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(forecast.total_conservative)}
                  </p>
                  <p className="text-xs text-red-600 mt-1">Worst case scenario</p>
                </div>

                {/* Realistic Total */}
                <div className="bg-blue-50 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Realistic</span>
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(forecast.total_realistic)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Most likely scenario</p>
                </div>

                {/* Optimistic Total */}
                <div className="bg-green-50 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Optimistic</span>
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(forecast.total_optimistic)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Best case scenario</p>
                </div>
              </div>

              {/* Revenue Timeline Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Timeline</h3>
                  <Button onClick={handleExport} variant="secondary" className="text-sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#111' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Conservative"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Realistic"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Optimistic"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Breakdown Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Average Revenue Breakdown
                </h3>

                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={breakdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#111' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Forecasts Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Detailed Forecasts</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Period
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Conservative
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Realistic
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Optimistic
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {forecast.forecasts.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {f.forecast_period}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">
                            {formatCurrency(f.conservative)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-blue-600 font-bold">
                            {formatCurrency(f.realistic)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                            {formatCurrency(f.optimistic)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-600">
                            {(f.confidence_score * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!forecast && !loading && !generating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <DollarSign className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Ready to Predict Your Revenue?
              </h3>
              <p className="text-blue-700">
                Select an artist above and generate a forecast to see ML-based revenue predictions.
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
