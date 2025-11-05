'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { api } from '@/lib/api'
import {
  Home,
  Users,
  Activity,
  Heart,
  ListTodo,
  BarChart3,
  Settings,
  Calendar,
  DollarSign,
  Bell,
  FileText,
  Search,
  Music,
  Zap,
  TrendingUp,
} from 'lucide-react'

interface Artist {
  id: string
  name: string
  image_url: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(false)

  // Navigation items
  const pages = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, category: 'Navigate' },
    { name: 'Actions', href: '/dashboard/actions', icon: ListTodo, category: 'Navigate' },
    { name: 'Momentum Index', href: '/dashboard/momentum', icon: Activity, category: 'Navigate' },
    { name: 'Superfans', href: '/dashboard/superfans', icon: Heart, category: 'Navigate' },
    { name: 'Artists', href: '/dashboard/artists', icon: Users, category: 'Navigate' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, category: 'Navigate' },
    { name: 'Release Optimizer', href: '/dashboard/releases', icon: Calendar, category: 'Navigate' },
    { name: 'Revenue Forecasting', href: '/dashboard/forecasts', icon: DollarSign, category: 'Navigate' },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell, category: 'Navigate' },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText, category: 'Navigate' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, category: 'Navigate' },
  ]

  // Load artists when opening
  useEffect(() => {
    if (isOpen && artists.length === 0) {
      loadArtists()
    }
  }, [isOpen])

  const loadArtists = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/artists/')
      setArtists(response.data)
    } catch (err) {
      console.error('Failed to load artists:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (callback: () => void) => {
    callback()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl">
        <Command
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          shouldFilter={false}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search pages, artists, actions..."
              className="w-full py-4 text-lg bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
            />
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 text-xs font-mono text-gray-600 dark:text-gray-400">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Loading...' : 'No results found.'}
            </Command.Empty>

            {/* Pages Section */}
            <Command.Group heading="Pages" className="mb-2">
              {pages
                .filter((page) =>
                  page.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((page) => {
                  const Icon = page.icon
                  return (
                    <Command.Item
                      key={page.href}
                      value={page.name}
                      onSelect={() => handleSelect(() => router.push(page.href))}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/30 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{page.name}</span>
                    </Command.Item>
                  )
                })}
            </Command.Group>

            {/* Artists Section */}
            {artists.length > 0 && (
              <Command.Group heading="Artists" className="mb-2">
                {artists
                  .filter((artist) =>
                    artist.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((artist) => (
                    <Command.Item
                      key={artist.id}
                      value={artist.name}
                      onSelect={() =>
                        handleSelect(() => router.push(`/dashboard/artists/${artist.id}`))
                      }
                      className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 aria-selected:bg-purple-50 dark:aria-selected:bg-purple-900/30 transition-colors"
                    >
                      {artist.image_url ? (
                        <img
                          src={artist.image_url}
                          alt={artist.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                          <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{artist.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">View artist profile</p>
                      </div>
                    </Command.Item>
                  ))}
              </Command.Group>
            )}

            {/* Quick Actions */}
            {search === '' && (
              <Command.Group heading="Quick Actions">
                <Command.Item
                  value="add-artist"
                  onSelect={() => handleSelect(() => router.push('/dashboard/artists/add'))}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 aria-selected:bg-green-50 dark:aria-selected:bg-green-900/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Add New Artist</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Connect a new artist profile</p>
                  </div>
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono">↵</kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono">ESC</kbd>
              <span>Close</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  )
}
