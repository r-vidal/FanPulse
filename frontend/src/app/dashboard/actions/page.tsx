'use client'

/**
 * Actions Page
 *
 * Complete list of all Next Best Actions across all artists
 * with filtering, sorting, and action management
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ActionCard from '@/components/actions/ActionCard'
import ActionFilters from '@/components/actions/ActionFilters'
import Alert from '@/components/ui/Alert'
import { SkeletonStats, SkeletonList } from '@/components/ui/Skeleton'
import { actionsApi } from '@/lib/api/actions'
import { api } from '@/lib/api'
import { NextAction, ActionUrgency, ActionStatus } from '@/types/actions'
import { ListTodo, Loader2 } from 'lucide-react'

interface Artist {
  id: string
  name: string
}

export default function ActionsPage() {
  const router = useRouter()
  const [artists, setArtists] = useState<Artist[]>([])
  const [allActions, setAllActions] = useState<NextAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState<ActionUrgency | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'all'>('pending')
  const [artistFilter, setArtistFilter] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load artists first
      const artistsResponse = await api.get('/api/artists/')
      const artistsList: Artist[] = artistsResponse.data
      setArtists(artistsList)

      // Load actions for each artist
      const actionsPromises = artistsList.map(artist =>
        actionsApi.getForArtist(artist.id)
          .then(actions => actions.map(action => ({
            ...action,
            artist_name: artist.name
          })))
          .catch(err => {
            console.error(`Failed to load actions for ${artist.name}:`, err)
            return []
          })
      )

      const actionsArrays = await Promise.all(actionsPromises)
      const combinedActions = actionsArrays.flat()

      // Sort by urgency and created_at
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      combinedActions.sort((a, b) => {
        const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
        if (urgencyDiff !== 0) return urgencyDiff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setAllActions(combinedActions)
    } catch (err: any) {
      console.error('Failed to load actions:', err)
      setError(err.response?.data?.detail || 'Failed to load actions')
    } finally {
      setLoading(false)
    }
  }

  const handleActionUpdate = async (actionId: string, status: 'completed' | 'snoozed' | 'ignored') => {
    try {
      await actionsApi.updateStatus(actionId, status)

      // Update local state
      setAllActions(prevActions =>
        prevActions.map(action =>
          action.id === actionId
            ? { ...action, status, completed_at: status === 'completed' ? new Date().toISOString() : null }
            : action
        )
      )
    } catch (err: any) {
      console.error('Failed to update action:', err)
      alert('Failed to update action. Please try again.')
    }
  }

  // Apply filters
  const filteredActions = allActions.filter(action => {
    // Urgency filter
    if (urgencyFilter !== 'all' && action.urgency !== urgencyFilter) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all' && action.status !== statusFilter) {
      return false
    }

    // Artist filter
    if (artistFilter !== 'all' && action.artist_id !== artistFilter) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        action.title.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query) ||
        action.artist_name.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Stats
  const stats = {
    total: allActions.length,
    pending: allActions.filter(a => a.status === 'pending').length,
    completed: allActions.filter(a => a.status === 'completed').length,
    critical: allActions.filter(a => a.urgency === 'critical' && a.status === 'pending').length,
    high: allActions.filter(a => a.urgency === 'high' && a.status === 'pending').length
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ListTodo className="w-8 h-8 text-blue-600" />
                Next Best Actions
              </h1>
              <p className="mt-2 text-gray-600">
                AI-powered recommendations to grow your artists
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm font-medium text-gray-500">Total</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-blue-50 rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="text-sm font-medium text-blue-700">Pending</div>
                <div className="mt-1 text-2xl font-bold text-blue-900">{stats.pending}</div>
              </div>
              <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
                <div className="text-sm font-medium text-green-700">Completed</div>
                <div className="mt-1 text-2xl font-bold text-green-900">{stats.completed}</div>
              </div>
              <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
                <div className="text-sm font-medium text-red-700">Critical</div>
                <div className="mt-1 text-2xl font-bold text-red-900">{stats.critical}</div>
              </div>
              <div className="bg-orange-50 rounded-lg shadow p-4 border-l-4 border-orange-500">
                <div className="text-sm font-medium text-orange-700">High</div>
                <div className="mt-1 text-2xl font-bold text-orange-900">{stats.high}</div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <>
              <SkeletonStats />
              <SkeletonList items={8} />
            </>
          )}

          {/* Content */}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <ActionFilters
                  urgency={urgencyFilter}
                  status={statusFilter}
                  artistId={artistFilter}
                  search={searchQuery}
                  artists={artists}
                  onUrgencyChange={setUrgencyFilter}
                  onStatusChange={setStatusFilter}
                  onArtistChange={setArtistFilter}
                  onSearchChange={setSearchQuery}
                />
              </div>

              {/* Actions List */}
              <div className="lg:col-span-3 space-y-4">
                {filteredActions.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <ListTodo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery || urgencyFilter !== 'all' || statusFilter !== 'all' || artistFilter !== 'all'
                        ? 'No actions match your filters'
                        : 'No actions yet'}
                    </h3>
                    <p className="text-gray-600">
                      {allActions.length === 0
                        ? 'Add artists and capture data to get AI-powered recommendations'
                        : 'Try adjusting your filters'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing <strong>{filteredActions.length}</strong> of <strong>{allActions.length}</strong> actions
                      </p>
                    </div>

                    {filteredActions.map((action) => (
                      <ActionCard
                        key={action.id}
                        action={action}
                        onComplete={(id) => handleActionUpdate(id, 'completed')}
                        onSnooze={(id) => handleActionUpdate(id, 'snoozed')}
                        onIgnore={(id) => handleActionUpdate(id, 'ignored')}
                        onViewArtist={(artistId) => router.push(`/dashboard/artists/${artistId}`)}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
