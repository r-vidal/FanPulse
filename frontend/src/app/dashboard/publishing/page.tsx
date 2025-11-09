'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import {
  Calendar,
  Plus,
  Instagram,
  Facebook,
  Send,
  Image,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react'

interface ScheduledPost {
  id: string
  caption: string
  media_urls: string[]
  platforms: string[]
  status: string
  scheduled_for: string | null
  created_at: string
}

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Send,
  twitter: Send,
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  tiktok: 'bg-black',
  twitter: 'bg-blue-400',
}

export default function PublishingPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [showComposer, setShowComposer] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/publishing/posts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4" />
      case 'scheduled':
        return <Clock className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Publishing Studio</h2>
              <p className="mt-2 text-gray-600">
                Schedule and publish content across all your social media platforms
              </p>
            </div>
            <Button onClick={() => setShowComposer(!showComposer)}>
              <Plus className="w-4 h-4 mr-2" />
              {showComposer ? 'Cancel' : 'New Post'}
            </Button>
          </div>

          {/* Post Composer */}
          {showComposer && (
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-500">
              <PostComposer onClose={() => setShowComposer(false)} onSuccess={fetchPosts} />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Posts</span>
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{posts.length}</p>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Scheduled</span>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {posts.filter((p) => p.status === 'scheduled').length}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Published</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-900">
                {posts.filter((p) => p.status === 'published').length}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">Draft</span>
                <Image className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {posts.filter((p) => p.status === 'draft').length}
              </p>
            </div>
          </div>

          {/* Posts List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Scheduled Posts</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first post to start scheduling content across platforms
                </p>
                <Button onClick={() => setShowComposer(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Platforms */}
                        <div className="flex items-center gap-2 mb-3">
                          {post.platforms.map((platform) => {
                            const Icon = PLATFORM_ICONS[platform] || Send
                            return (
                              <div
                                key={platform}
                                className={`${PLATFORM_COLORS[platform] || 'bg-gray-500'} text-white rounded-full p-2`}
                                title={platform}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                            )
                          })}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(post.status)}`}
                          >
                            {getStatusIcon(post.status)}
                            {post.status}
                          </span>
                        </div>

                        {/* Caption */}
                        <p className="text-gray-900 mb-2 line-clamp-2">{post.caption}</p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {post.scheduled_for ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(post.scheduled_for).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-400">No schedule</span>
                          )}
                          {post.media_urls.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Image className="w-4 h-4" />
                              {post.media_urls.length} media
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// Post Composer Component
function PostComposer({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [caption, setCaption] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [scheduledFor, setScheduledFor] = useState('')
  const [loading, setLoading] = useState(false)

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  const handleSubmit = async () => {
    if (!caption || platforms.length === 0) {
      alert('Please add a caption and select at least one platform')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/publishing/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption,
          platforms,
          scheduled_for: scheduledFor || null,
          media_urls: [],
          hashtags: [],
        }),
      })

      if (response.ok) {
        alert('Post created successfully!')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(`Failed: ${error.detail}`)
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Create New Post</h3>

      {/* Caption */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write your caption..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
        <p className="mt-1 text-sm text-gray-500">{caption.length} characters</p>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['instagram', 'facebook', 'tiktok', 'twitter'].map((platform) => {
            const Icon = PLATFORM_ICONS[platform]
            const isSelected = platforms.includes(platform)

            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium capitalize">{platform}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Schedule */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Schedule (Optional)
        </label>
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">Leave empty to publish immediately</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
          {loading ? (
            'Creating...'
          ) : scheduledFor ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Schedule Post
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Publish Now
            </>
          )}
        </Button>
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
      </div>
    </div>
  )
}
