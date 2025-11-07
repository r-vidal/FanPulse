'use client'

/**
 * Actions & Todo Page - Complete Rewrite for Q1 2026
 *
 * Features:
 * ✅ Complete actions list with filters
 * ✅ Search functionality
 * ✅ Bulk operations (Complete, Snooze, Ignore)
 * ✅ Actions history tab
 * ✅ Snooze management with duration picker
 * ✅ Type filter (content, release, engagement, revenue, growth)
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Advanced stats
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useArtistContext } from '@/contexts/ArtistContext'
import {
  ListTodo,
  Search,
  Filter,
  CheckSquare,
  Square,
  Check,
  Clock,
  X,
  TrendingUp,
  Calendar,
  MessageSquare,
  DollarSign,
  Music,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  MoreVertical,
  Archive,
  Eye
} from 'lucide-react'

// ==================== TYPES ====================

type ActionUrgency = 'critical' | 'high' | 'medium' | 'low'
type ActionStatus = 'pending' | 'completed' | 'snoozed' | 'ignored'
type ActionType = 'content' | 'release' | 'engagement' | 'revenue' | 'growth' | 'platform' | 'audience'

interface Action {
  id: string
  artist_id: string
  artist_name: string
  action_type: ActionType
  title: string
  description: string
  urgency: ActionUrgency
  reason: string
  expected_impact: string
  status: ActionStatus
  created_at: string
  completed_at: string | null
  snoozed_until: string | null
}

// ==================== MOCK DATA ====================

const generateMockActions = (count: number = 20): Action[] => {
  const artists = [
    { id: '1', name: 'Luna Park' },
    { id: '2', name: 'The Neon Dreams' },
    { id: '3', name: 'Echo Valley' },
  ]

  const actionTypes: { type: ActionType; templates: Array<{ title: string; description: string; impact: string }> }[] = [
    {
      type: 'content',
      templates: [
        {
          title: 'Post on Instagram NOW',
          description: 'Your audience is 3x more active in the next 2 hours (18h-20h). Engagement peak detected.',
          impact: '+250% engagement rate expected'
        },
        {
          title: 'Share TikTok behind-the-scenes',
          description: 'Fans are asking for studio content. 127 comments mentioning "making of".',
          impact: '+40% follower growth expected'
        },
        {
          title: 'Reply to top comments',
          description: '23 high-engagement comments from superfans waiting for responses.',
          impact: '+15% retention rate'
        }
      ]
    },
    {
      type: 'release',
      templates: [
        {
          title: 'Release next single on Friday',
          description: 'Optimal release window detected. Low competition, high momentum.',
          impact: '+180% first-week streams expected'
        },
        {
          title: 'Schedule album announcement',
          description: 'Fan anticipation at peak. 85% of superfans expect new music this quarter.',
          impact: '+300% pre-save rate expected'
        }
      ]
    },
    {
      type: 'engagement',
      templates: [
        {
          title: 'Run Instagram Q&A session',
          description: 'Engagement dropped 12% this week. Interactive content recommended.',
          impact: '+35% engagement recovery'
        },
        {
          title: 'Host listening party',
          description: '147 superfans in Paris area. Virtual event recommended.',
          impact: '+50 new superfans expected'
        }
      ]
    },
    {
      type: 'revenue',
      templates: [
        {
          title: 'Launch merchandise drop',
          description: 'Revenue potential: €12,400. 89% of superfans interested in merch.',
          impact: '€12,400 revenue in 30 days'
        },
        {
          title: 'Monetize YouTube content',
          description: 'Channel eligible. 2.4M views unmemonetized.',
          impact: '€3,200/month recurring revenue'
        }
      ]
    },
    {
      type: 'growth',
      templates: [
        {
          title: 'Submit to "Indie Vibes" playlist',
          description: 'Perfect fit detected. 850K followers, 78% genre match.',
          impact: '+45K streams/week expected'
        },
        {
          title: 'Collaborate with @indie_curator',
          description: 'High collaboration potential. 320K followers, 12% overlap.',
          impact: '+8K followers expected'
        }
      ]
    },
    {
      type: 'platform',
      templates: [
        {
          title: 'Connect Apple Music',
          description: '23% of your audience uses Apple Music. Integration recommended.',
          impact: '+15% analytics coverage'
        },
        {
          title: 'Verify Spotify profile',
          description: 'Verification available. +35% profile visits expected.',
          impact: '+35% discoverability'
        }
      ]
    },
    {
      type: 'audience',
      templates: [
        {
          title: 'Contact top 10 superfans',
          description: 'Email addresses available. Personal outreach recommended.',
          impact: '+10 brand ambassadors'
        },
        {
          title: 'Target Berlin audience',
          description: 'New city detected: 2.4K listeners in Berlin (+340% growth).',
          impact: '+5K listeners in 30 days'
        }
      ]
    }
  ]

  const urgencies: ActionUrgency[] = ['critical', 'high', 'medium', 'low']
  const statuses: ActionStatus[] = ['pending', 'pending', 'pending', 'completed', 'snoozed']

  const actions: Action[] = []

  for (let i = 0; i < count; i++) {
    const artist = artists[i % artists.length]
    const actionTypeGroup = actionTypes[i % actionTypes.length]
    const template = actionTypeGroup.templates[i % actionTypeGroup.templates.length]
    const status = statuses[i % statuses.length]
    const urgency = urgencies[Math.floor(Math.random() * urgencies.length)]

    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - (i * 2)) // Spread actions over time

    const completedAt = status === 'completed' ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString() : null
    const snoozedUntil = status === 'snoozed' ? new Date(Date.now() + (i * 6 * 60 * 60 * 1000)).toISOString() : null

    actions.push({
      id: `action-${i + 1}`,
      artist_id: artist.id,
      artist_name: artist.name,
      action_type: actionTypeGroup.type,
      title: template.title,
      description: template.description,
      urgency,
      reason: `AI detected opportunity based on ${actionTypeGroup.type} analysis`,
      expected_impact: template.impact,
      status,
      created_at: createdAt.toISOString(),
      completed_at: completedAt,
      snoozed_until: snoozedUntil
    })
  }

  // Sort by urgency and date
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  actions.sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === 'pending') return -1
      if (b.status === 'pending') return 1
    }
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    if (urgencyDiff !== 0) return urgencyDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return actions
}

// ==================== MAIN COMPONENT ====================

export default function ActionsPage() {
  const router = useRouter()
  const { selectedArtist, isAllArtists, artists } = useArtistContext()
  const [loading, setLoading] = useState(true)
  const [allActions, setAllActions] = useState<Action[]>([])

  // Tab state
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState<ActionUrgency | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ActionType | 'all'>('all')
  const [artistFilter, setArtistFilter] = useState<string | 'all'>('all')

  // Bulk selection state
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set())
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false)

  // Snooze picker state
  const [snoozeActionId, setSnoozeActionId] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    const mockActions = generateMockActions(25)
    setAllActions(mockActions)
    setLoading(false)
  }

  // Filter actions based on tab and filters
  const filteredActions = allActions.filter(action => {
    // Tab filter
    if (activeTab === 'active' && (action.status === 'completed' || action.status === 'ignored')) {
      return false
    }
    if (activeTab === 'history' && action.status !== 'completed' && action.status !== 'ignored') {
      return false
    }

    // Artist filter
    if (!isAllArtists && selectedArtist) {
      if (action.artist_id !== selectedArtist.id) return false
    }
    if (artistFilter !== 'all' && action.artist_id !== artistFilter) {
      return false
    }

    // Urgency filter
    if (urgencyFilter !== 'all' && action.urgency !== urgencyFilter) {
      return false
    }

    // Type filter
    if (typeFilter !== 'all' && action.action_type !== typeFilter) {
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
    snoozed: allActions.filter(a => a.status === 'snoozed').length,
    completed: allActions.filter(a => a.status === 'completed').length,
    critical: allActions.filter(a => a.urgency === 'critical' && a.status === 'pending').length,
  }

  // Action handlers
  const handleActionUpdate = (actionId: string, status: ActionStatus, snoozedUntil?: string) => {
    setAllActions(prevActions =>
      prevActions.map(action =>
        action.id === actionId
          ? {
              ...action,
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : null,
              snoozed_until: snoozedUntil || null
            }
          : action
      )
    )
    setSelectedActions(prev => {
      const next = new Set(prev)
      next.delete(actionId)
      return next
    })
  }

  const handleBulkAction = (action: 'complete' | 'snooze' | 'ignore') => {
    selectedActions.forEach(actionId => {
      if (action === 'complete') {
        handleActionUpdate(actionId, 'completed')
      } else if (action === 'snooze') {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        handleActionUpdate(actionId, 'snoozed', tomorrow.toISOString())
      } else if (action === 'ignore') {
        handleActionUpdate(actionId, 'ignored')
      }
    })
    setSelectedActions(new Set())
    setBulkMenuOpen(false)
  }

  const toggleSelectAll = () => {
    if (selectedActions.size === filteredActions.length) {
      setSelectedActions(new Set())
    } else {
      setSelectedActions(new Set(filteredActions.map(a => a.id)))
    }
  }

  const toggleSelectAction = (actionId: string) => {
    setSelectedActions(prev => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
      } else {
        next.add(actionId)
      }
      return next
    })
  }

  // ==================== RENDER ====================

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <ListTodo className="w-6 h-6 text-white" />
                </div>
                Next Best Actions
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                AI-powered recommendations to grow your music career
              </p>
            </div>
            {selectedActions.size > 0 && (
              <div className="relative">
                <button
                  onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectedActions.size} selected
                  <ChevronDown className="w-4 h-4" />
                </button>
                {bulkMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <button
                      onClick={() => handleBulkAction('complete')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                      Mark as Complete
                    </button>
                    <button
                      onClick={() => handleBulkAction('snooze')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
                    >
                      <Clock className="w-4 h-4 text-purple-600" />
                      Snooze (24h)
                    </button>
                    <button
                      onClick={() => handleBulkAction('ignore')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                      Ignore
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border-2 border-blue-500 dark:border-blue-600 p-4">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Pending</div>
              <div className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-300">{stats.pending}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border-2 border-purple-500 dark:border-purple-600 p-4">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-400">Snoozed</div>
              <div className="mt-1 text-3xl font-bold text-purple-900 dark:text-purple-300">{stats.snoozed}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border-2 border-green-500 dark:border-green-600 p-4">
              <div className="text-sm font-medium text-green-700 dark:text-green-400">Completed</div>
              <div className="mt-1 text-3xl font-bold text-green-900 dark:text-green-300">{stats.completed}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border-2 border-red-500 dark:border-red-600 p-4">
              <div className="text-sm font-medium text-red-700 dark:text-red-400">Critical</div>
              <div className="mt-1 text-3xl font-bold text-red-900 dark:text-red-300">{stats.critical}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'active'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Active Actions ({stats.pending + stats.snoozed})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              History ({stats.completed})
            </button>
          </div>

          {/* Filters & Search */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Urgency Filter */}
              <div>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value as ActionUrgency | 'all')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Urgencies</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as ActionType | 'all')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="content">Content</option>
                  <option value="release">Release</option>
                  <option value="engagement">Engagement</option>
                  <option value="revenue">Revenue</option>
                  <option value="growth">Growth</option>
                  <option value="platform">Platform</option>
                  <option value="audience">Audience</option>
                </select>
              </div>

              {/* Artist Filter */}
              {isAllArtists && (
                <div>
                  <select
                    value={artistFilter}
                    onChange={(e) => setArtistFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="all">All Artists</option>
                    {artists.map(artist => (
                      <option key={artist.id} value={artist.id}>{artist.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Active filters indicator */}
            {(searchQuery || urgencyFilter !== 'all' || typeFilter !== 'all' || artistFilter !== 'all') && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                {searchQuery && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                    Search: {searchQuery}
                  </span>
                )}
                {urgencyFilter !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                    {urgencyFilter}
                  </span>
                )}
                {typeFilter !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                    {typeFilter}
                  </span>
                )}
                {artistFilter !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                    {artists.find(a => a.id === artistFilter)?.name}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setUrgencyFilter('all')
                    setTypeFilter('all')
                    setArtistFilter('all')
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions List */}
          {!loading && (
            <>
              {/* Results header */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <strong>{filteredActions.length}</strong> of <strong>{activeTab === 'active' ? stats.pending + stats.snoozed : stats.completed}</strong> actions
                </p>
                {activeTab === 'active' && filteredActions.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                  >
                    {selectedActions.size === filteredActions.length ? (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        Deselect all
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        Select all
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Empty state */}
              {filteredActions.length === 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                  <ListTodo className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchQuery || urgencyFilter !== 'all' || typeFilter !== 'all' || artistFilter !== 'all'
                      ? 'No actions match your filters'
                      : activeTab === 'active'
                      ? 'No active actions'
                      : 'No completed actions yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || urgencyFilter !== 'all' || typeFilter !== 'all' || artistFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Actions will appear here as AI discovers opportunities'}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {filteredActions.map((action) => (
                  <ActionCardComponent
                    key={action.id}
                    action={action}
                    isSelected={selectedActions.has(action.id)}
                    onToggleSelect={toggleSelectAction}
                    onComplete={() => handleActionUpdate(action.id, 'completed')}
                    onSnooze={(until) => handleActionUpdate(action.id, 'snoozed', until)}
                    onIgnore={() => handleActionUpdate(action.id, 'ignored')}
                    showCheckbox={activeTab === 'active'}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// ==================== ACTION CARD COMPONENT ====================

interface ActionCardProps {
  action: Action
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onComplete: () => void
  onSnooze: (until: string) => void
  onIgnore: () => void
  showCheckbox: boolean
}

function ActionCardComponent({
  action,
  isSelected,
  onToggleSelect,
  onComplete,
  onSnooze,
  onIgnore,
  showCheckbox
}: ActionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [snoozePickerOpen, setSnoozePickerOpen] = useState(false)

  const getUrgencyConfig = (urgency: ActionUrgency) => {
    const configs = {
      critical: { bg: 'from-red-500 to-red-600', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
      high: { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
      medium: { bg: 'from-yellow-500 to-yellow-600', text: 'text-yellow-600 dark:text-yellow-400', badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
      low: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' }
    }
    return configs[urgency]
  }

  const getTypeIcon = (type: ActionType) => {
    const icons = {
      content: <MessageSquare className="w-5 h-5" />,
      release: <Music className="w-5 h-5" />,
      engagement: <Target className="w-5 h-5" />,
      revenue: <DollarSign className="w-5 h-5" />,
      growth: <TrendingUp className="w-5 h-5" />,
      platform: <AlertCircle className="w-5 h-5" />,
      audience: <Eye className="w-5 h-5" />
    }
    return icons[type]
  }

  const urgencyConfig = getUrgencyConfig(action.urgency)

  const handleSnooze = (hours: number) => {
    const until = new Date()
    until.setHours(until.getHours() + hours)
    onSnooze(until.toISOString())
    setSnoozePickerOpen(false)
    setMenuOpen(false)
  }

  return (
    <div
      className={`
        bg-white dark:bg-gray-900 rounded-xl border-2 transition-all
        ${isSelected
          ? 'border-blue-500 dark:border-blue-600 shadow-lg'
          : action.status === 'snoozed'
          ? 'border-purple-200 dark:border-purple-800 opacity-60'
          : 'border-gray-200 dark:border-gray-800'
        }
        ${action.status !== 'completed' && action.status !== 'ignored' ? 'hover:shadow-md' : 'opacity-75'}
      `}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          {showCheckbox && (
            <button
              onClick={() => onToggleSelect(action.id)}
              className="mt-1 flex-shrink-0"
            >
              {isSelected ? (
                <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <Square className="w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              )}
            </button>
          )}

          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${urgencyConfig.bg} flex items-center justify-center text-white flex-shrink-0`}>
            {getTypeIcon(action.action_type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {action.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${urgencyConfig.badge}`}>
                    {action.urgency.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                    {action.action_type}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    {action.artist_name}
                  </span>
                  {action.status === 'snoozed' && action.snoozed_until && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Until {new Date(action.snoozed_until).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {action.status === 'completed' && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Menu */}
              {action.status !== 'completed' && action.status !== 'ignored' && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <button
                        onClick={() => {
                          onComplete()
                          setMenuOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                        Mark as Complete
                      </button>
                      <button
                        onClick={() => {
                          setSnoozePickerOpen(true)
                          setMenuOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
                      >
                        <Clock className="w-4 h-4 text-purple-600" />
                        Snooze
                      </button>
                      <button
                        onClick={() => {
                          onIgnore()
                          setMenuOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                        Ignore
                      </button>
                    </div>
                  )}

                  {/* Snooze Picker */}
                  {snoozePickerOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-20">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Snooze until...</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleSnooze(2)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                        >
                          2 hours
                        </button>
                        <button
                          onClick={() => handleSnooze(6)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                        >
                          6 hours
                        </button>
                        <button
                          onClick={() => handleSnooze(24)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                        >
                          Tomorrow
                        </button>
                        <button
                          onClick={() => handleSnooze(72)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                        >
                          3 days
                        </button>
                        <button
                          onClick={() => handleSnooze(168)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                        >
                          1 week
                        </button>
                        <button
                          onClick={() => setSnoozePickerOpen(false)}
                          className="w-full px-3 py-2 text-center text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-2 pt-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {action.description}
            </p>

            {/* Expected Impact */}
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-700 dark:text-green-400">
                {action.expected_impact}
              </span>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>
                Created {new Date(action.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {action.completed_at && (
                <span>
                  Completed {new Date(action.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
