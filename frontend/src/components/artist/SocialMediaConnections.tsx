'use client'

import { CheckCircle, XCircle } from 'lucide-react'

interface SocialMediaConnectionsProps {
  spotifyId?: string
  instagramId?: string
  youtubeId?: string
  appleMusicId?: string
  tiktokId?: string
  twitterId?: string
  facebookId?: string
}

interface Platform {
  name: string
  icon: string
  connected: boolean
  color: string
}

export function SocialMediaConnections({
  spotifyId,
  instagramId,
  youtubeId,
  appleMusicId,
  tiktokId,
  twitterId,
  facebookId,
}: SocialMediaConnectionsProps) {
  const platforms: Platform[] = [
    {
      name: 'Spotify',
      icon: '🎵',
      connected: !!spotifyId,
      color: 'bg-green-500',
    },
    {
      name: 'Apple Music',
      icon: '🍎',
      connected: !!appleMusicId,
      color: 'bg-pink-500',
    },
    {
      name: 'Instagram',
      icon: '📸',
      connected: !!instagramId,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
    {
      name: 'TikTok',
      icon: '🎬',
      connected: !!tiktokId,
      color: 'bg-black',
    },
    {
      name: 'YouTube',
      icon: '▶️',
      connected: !!youtubeId,
      color: 'bg-red-500',
    },
    {
      name: 'Twitter',
      icon: '🐦',
      connected: !!twitterId,
      color: 'bg-blue-400',
    },
    {
      name: 'Facebook',
      icon: '👤',
      connected: !!facebookId,
      color: 'bg-blue-600',
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <div
          key={platform.name}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            ${platform.connected
              ? 'bg-green-50 border border-green-200'
              : 'bg-gray-50 border border-gray-200'
            }
            transition-all hover:shadow-sm
          `}
          title={platform.connected ? `${platform.name} connected` : `${platform.name} not connected`}
        >
          <span className="text-lg">{platform.icon}</span>
          <span className={`text-sm font-medium ${platform.connected ? 'text-gray-900' : 'text-gray-400'}`}>
            {platform.name}
          </span>
          {platform.connected ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  )
}
