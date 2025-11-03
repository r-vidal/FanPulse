/**
 * ActionFilters Component
 *
 * Filters for actions list (urgency, status, artist, search)
 */

import { Search, Filter } from 'lucide-react'
import { ActionUrgency, ActionStatus, URGENCY_CONFIG, STATUS_CONFIG } from '@/types/actions'

interface Artist {
  id: string
  name: string
}

interface ActionFiltersProps {
  urgency: ActionUrgency | 'all'
  status: ActionStatus | 'all'
  artistId: string | 'all'
  search: string
  artists: Artist[]
  onUrgencyChange: (urgency: ActionUrgency | 'all') => void
  onStatusChange: (status: ActionStatus | 'all') => void
  onArtistChange: (artistId: string | 'all') => void
  onSearchChange: (search: string) => void
}

export default function ActionFilters({
  urgency,
  status,
  artistId,
  search,
  artists,
  onUrgencyChange,
  onStatusChange,
  onArtistChange,
  onSearchChange
}: ActionFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search actions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Urgency Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Urgency
        </label>
        <select
          value={urgency}
          onChange={(e) => onUrgencyChange(e.target.value as ActionUrgency | 'all')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Urgencies</option>
          <option value="critical">{URGENCY_CONFIG.critical.label}</option>
          <option value="high">{URGENCY_CONFIG.high.label}</option>
          <option value="medium">{URGENCY_CONFIG.medium.label}</option>
          <option value="low">{URGENCY_CONFIG.low.label}</option>
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as ActionStatus | 'all')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="pending">{STATUS_CONFIG.pending.label}</option>
          <option value="completed">{STATUS_CONFIG.completed.label}</option>
          <option value="snoozed">{STATUS_CONFIG.snoozed.label}</option>
          <option value="ignored">{STATUS_CONFIG.ignored.label}</option>
        </select>
      </div>

      {/* Artist Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Artist
        </label>
        <select
          value={artistId}
          onChange={(e) => onArtistChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Artists</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filters Summary */}
      {(urgency !== 'all' || status !== 'all' || artistId !== 'all' || search) && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {[
                urgency !== 'all' && 'urgency',
                status !== 'all' && 'status',
                artistId !== 'all' && 'artist',
                search && 'search'
              ].filter(Boolean).length} filter(s) active
            </span>
            <button
              onClick={() => {
                onUrgencyChange('all')
                onStatusChange('all')
                onArtistChange('all')
                onSearchChange('')
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
