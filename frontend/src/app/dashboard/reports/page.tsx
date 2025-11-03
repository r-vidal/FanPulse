'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { reportsApi } from '@/lib/api/reports'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import {
  FileText,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Palette,
} from 'lucide-react'
import type { Report, ReportRequest } from '@/types'

interface Artist {
  id: string
  name: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state
  const [selectedArtist, setSelectedArtist] = useState<string>('')
  const [reportType, setReportType] = useState<'streaming' | 'engagement' | 'revenue' | 'comprehensive'>('comprehensive')
  const [format, setFormat] = useState<'pdf' | 'html'>('pdf')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#1e40af')

  useEffect(() => {
    fetchReports()
    fetchArtists()
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await reportsApi.getAll()
      setReports(data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch reports:', err)
      setError(err.response?.data?.detail || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const fetchArtists = async () => {
    try {
      const response = await api.get('/api/artists/')
      setArtists(response.data)
      if (response.data.length > 0) {
        setSelectedArtist(response.data[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch artists:', err)
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedArtist || !startDate || !endDate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const request: ReportRequest = {
        artist_id: selectedArtist,
        report_type: reportType,
        format,
        start_date: startDate,
        end_date: endDate,
      }

      if (companyName || logoUrl || primaryColor || secondaryColor) {
        request.branding = {
          company_name: companyName || undefined,
          logo_url: logoUrl || undefined,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        }
      }

      await reportsApi.generate(request)
      setShowCreateModal(false)
      fetchReports()

      // Reset form
      setCompanyName('')
      setLogoUrl('')
      setPrimaryColor('#3b82f6')
      setSecondaryColor('#1e40af')
    } catch (err: any) {
      console.error('Failed to generate report:', err)
      alert(err.response?.data?.detail || 'Failed to generate report')
    }
  }

  const handleDownload = async (reportId: string, artistName: string) => {
    try {
      const blob = await reportsApi.download(reportId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const report = reports.find(r => r.id === reportId)
      const ext = report?.format || 'pdf'
      link.download = `${artistName}_report_${new Date().toISOString().split('T')[0]}.${ext}`

      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Failed to download report:', err)
      alert('Failed to download report')
    }
  }

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return
    }

    try {
      await reportsApi.delete(reportId)
      fetchReports()
    } catch (err: any) {
      console.error('Failed to delete report:', err)
      alert(err.response?.data?.detail || 'Failed to delete report')
    }
  }

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusBadge = (status: Report['status']) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${styles[status]}`}>
        {status}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getReportTypeLabel = (type: string) => {
    const labels = {
      streaming: 'Streaming Analytics',
      engagement: 'Engagement Report',
      revenue: 'Revenue Report',
      comprehensive: 'Comprehensive Report',
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">White-Label Reports</h2>
              <p className="mt-2 text-gray-600">
                Generate branded PDF and HTML reports for your artists
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Reports List */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Clock className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">No Reports Yet</h3>
              <p className="text-blue-700 mb-4">
                Generate your first branded report to share with artists, labels, or investors.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Your First Report
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => {
                const artist = artists.find(a => a.id === report.artist_id)
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-lg shadow border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(report.status)}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getReportTypeLabel(report.report_type)}
                          </h3>
                          {getStatusBadge(report.status)}
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded uppercase">
                            {report.format}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          Artist: <strong>{artist?.name || 'Unknown'}</strong>
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500">Date Range:</span>
                            <p className="font-medium text-gray-900">
                              {formatDate(report.date_range.start)} - {formatDate(report.date_range.end)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Generated:</span>
                            <p className="font-medium text-gray-900">
                              {formatDate(report.generated_at)}
                            </p>
                          </div>
                          {report.branding?.company_name && (
                            <div>
                              <span className="text-gray-500">Company:</span>
                              <p className="font-medium text-gray-900">
                                {report.branding.company_name}
                              </p>
                            </div>
                          )}
                          {report.branding && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Branding:</span>
                              <div className="flex gap-1">
                                <div
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: report.branding.primary_color }}
                                  title="Primary color"
                                />
                                <div
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: report.branding.secondary_color }}
                                  title="Secondary color"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {report.status === 'completed' && (
                          <button
                            onClick={() => handleDownload(report.id, artist?.name || 'report')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Download report"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Create Report Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Generate New Report</h3>

                <div className="space-y-6">
                  {/* Report Configuration */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Report Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Artist *
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Report Type *
                        </label>
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="comprehensive">Comprehensive Report</option>
                          <option value="streaming">Streaming Analytics</option>
                          <option value="engagement">Engagement Report</option>
                          <option value="revenue">Revenue Report</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Format *
                        </label>
                        <select
                          value={format}
                          onChange={(e) => setFormat(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pdf">PDF</option>
                          <option value="html">HTML</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date *
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branding (Optional) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-5 h-5 text-gray-500" />
                      <h4 className="font-semibold text-gray-900">Branding (Optional)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Your Company"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Logo URL
                        </label>
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secondary Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button onClick={handleGenerateReport} className="flex-1">
                    Generate Report
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
