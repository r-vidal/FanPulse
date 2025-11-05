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
  appleMusicId?: string
  tiktokId?: string
  twitterId?: string
  facebookId?: string
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

// PRO Tier - Release Optimizer types
export interface ReleaseScore {
  id: string
  artist_id: string
  release_date: string
  score: number // 0-100
  factors: {
    momentum: number
    competition: number
    seasonal: number
    fan_readiness: number
    platform_trends: number
  }
  recommendations: string[]
  calculated_at: string
}

export interface ReleaseOptimization {
  optimal_dates: ReleaseScore[]
  avoid_dates: ReleaseScore[]
  best_score: number
  worst_score: number
}

// PRO Tier - Revenue Forecasting types
export interface RevenuePrediction {
  id: string
  artist_id: string
  forecast_period: string // e.g., "2024-Q1"
  conservative: number
  realistic: number
  optimistic: number
  breakdown: {
    streaming: number
    concerts: number
    merchandise: number
    sponsorships: number
    other: number
  }
  confidence_score: number
  calculated_at: string
}

export interface RevenueForecastResponse {
  artist_id: string
  forecasts: RevenuePrediction[]
  trend: 'increasing' | 'stable' | 'decreasing'
  total_conservative: number
  total_realistic: number
  total_optimistic: number
}

// PRO Tier - API Keys types
export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  rate_limit: number
  usage_count: number
  last_used_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface ApiKeyUsage {
  total_requests: number
  successful_requests: number
  failed_requests: number
  avg_response_time: number
  last_24h: number
  last_7d: number
  last_30d: number
}

// PRO Tier - White-Label Reports types
export interface Report {
  id: string
  artist_id: string
  report_type: 'streaming' | 'engagement' | 'revenue' | 'comprehensive'
  format: 'pdf' | 'html'
  date_range: {
    start: string
    end: string
  }
  branding: {
    logo_url?: string
    company_name?: string
    primary_color?: string
    secondary_color?: string
  }
  generated_at: string
  download_url?: string
  status: 'pending' | 'completed' | 'failed'
}

export interface ReportRequest {
  artist_id: string
  report_type: 'streaming' | 'engagement' | 'revenue' | 'comprehensive'
  format: 'pdf' | 'html'
  start_date: string
  end_date: string
  branding?: {
    logo_url?: string
    company_name?: string
    primary_color?: string
    secondary_color?: string
  }
}

// PRO Tier - Real-time Alerts types
export interface Opportunity {
  id: string
  artist_id: string
  artist_name: string
  type: 'viral_growth' | 'momentum_spike' | 'plateau_break' | 'release_window' | 'milestone'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  data: Record<string, any>
  recommended_actions: string[]
  detected_at: string
}

export interface RealtimeAlert extends Alert {
  opportunity_type?: string
  artist_name?: string
  recommended_actions?: string[]
}

export interface AlertStats {
  total: number
  unread: number
  by_priority: {
    critical: number
    high: number
    medium: number
    low: number
  }
  by_type: Record<string, number>
  last_24h: number
}
