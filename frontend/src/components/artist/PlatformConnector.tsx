'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Instagram, Music, Youtube, Facebook, Twitter, Plus, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'

interface Platform {
  id: string
  name: string
  icon: any
  color: string
  description: string
  authUrl: string
}

const PLATFORMS: Platform[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: Music,
    color: 'bg-green-500',
    description: 'Track streams, listeners, and playlists',
    authUrl: '/api/spotify/authorize',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Track posts, stories, and engagement',
    authUrl: '/api/instagram/authorize',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600',
    description: 'Track videos, views, and subscribers',
    authUrl: '/api/youtube/authorize',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: 'bg-black',
    description: 'Track videos and viral content',
    authUrl: '/api/tiktok/authorize',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: Twitter,
    color: 'bg-blue-400',
    description: 'Track tweets and engagement',
    authUrl: '#',
  },
]

interface PlatformConnectorProps {
  artistId: string
  connectedPlatforms?: string[]
}

export function PlatformConnector({ artistId, connectedPlatforms = [] }: PlatformConnectorProps) {
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = (platform: Platform) => {
    setConnecting(platform.id)
    // Redirect to OAuth flow
    window.location.href = `http://localhost:8000${platform.authUrl}?artist_id=${artistId}`
  }

  const isPlatformConnected = (platformId: string) => {
    return connectedPlatforms.includes(platformId)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {PLATFORMS.map((platform) => {
        const Icon = platform.icon
        const connected = isPlatformConnected(platform.id)
        const isConnecting = connecting === platform.id

        return (
          <div key={platform.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`${platform.color} text-white rounded-lg p-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                  {connected && (
                    <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                      <CheckCircle className="w-4 h-4" />
                      Connected
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

            {connected ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Stats
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => handleConnect(platform)}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>Connecting...</>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect {platform.name}
                  </>
                )}
              </Button>
            )}
          </div>
        )
      })}

      {/* Info Banner */}
      <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Why Connect Platforms?</h4>
            <p className="text-sm text-blue-700">
              Connect your social media and streaming platforms to automatically track performance metrics,
              detect viral content, calculate Fan Value Score, and get AI-powered recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
