// User types
export interface User {
  id: string
  email: string
  subscription_tier: 'solo' | 'pro' | 'label' | 'enterprise'
  is_verified: boolean
  created_at: string
}

// Artist types
export interface Artist {
  id: string
  userId: string
  spotifyId?: string
  instagramId?: string
  youtubeId?: string
  name: string
  genre: string
  imageUrl?: string
  createdAt: string
}

// Momentum types
export interface MomentumIndex {
  score: number // 0-10
  trend: 'rising' | 'falling' | 'stable'
  changeRate: number
  components: {
    streamGrowth: number
    engagementVelocity: number
    playlistMomentum: number
    socialVirality: number
    discovery: number
  }
  prediction: {
    next7Days: number
    next30Days: number
    confidence: number
  }
}

// Superfan types
export interface Superfan {
  id: string
  artistId: string
  platformUserId: string
  fvsScore: number // 0-100
  location?: string
  contact?: {
    email?: string
    instagram?: string
    tiktok?: string
  }
  stats: {
    listeningHours: number
    percentileRank: number
    engagementScore: number
    monetizationScore: number
  }
  lastUpdated: string
}

// Analytics types
export interface StreamData {
  timestamp: string
  platform: 'spotify' | 'apple' | 'youtube' | 'other'
  streams: number
  followers: number
}

export interface Alert {
  id: string
  artistId: string
  type: 'viral' | 'engagement_drop' | 'opportunity' | 'threat'
  severity: 'urgent' | 'warning' | 'info'
  message: string
  data: Record<string, any>
  createdAt: string
  resolvedAt?: string
}

// Revenue types
export interface RevenueForecast {
  artistId: string
  period: string
  conservative: number
  realistic: number
  optimistic: number
  breakdown: {
    streaming: number
    concerts: number
    merchandise: number
    subscriptions: number
    other: number
  }
  confidence: number
}
