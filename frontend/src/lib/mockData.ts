/**
 * Mock Data Utilities for FanPulse
 * Generates realistic fake data for all features until backend APIs are ready
 */

// Utility functions
export const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export const randomFloat = (min: number, max: number, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals))

export const randomItem = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)]

export const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

// Artist names pool
const artistNames = [
  'Luna Wave',
  'Arctic Minds',
  'The Velvet Echoes',
  'Neon Dreams',
  'Stellar Bloom',
  'Echo Chamber',
  'Midnight Canvas',
  'Solar Pulse',
  'Crystal Method',
  'Urban Legends',
]

const cities = [
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.006 },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
]

const genres = ['Pop', 'Hip-Hop', 'Electronic', 'Indie', 'Rock', 'R&B', 'Alternative', 'Trap', 'House']

const playlists = [
  { name: 'RapCaviar', followers: 14500000, editorial: true },
  { name: 'Today\'s Top Hits', followers: 32000000, editorial: true },
  { name: 'mint', followers: 6200000, editorial: true },
  { name: 'Hot Hits France', followers: 850000, editorial: true },
  { name: 'New Music Friday', followers: 4200000, editorial: true },
  { name: 'Indie Pop', followers: 2100000, editorial: false },
  { name: 'Chill Vibes', followers: 5600000, editorial: false },
  { name: 'Beast Mode', followers: 3800000, editorial: true },
]

// Fan Value Score Mock Data
export interface FVSData {
  score: number
  trend: number
  breakdown: {
    streaming: { score: number; weight: number; value: string }
    engagement: { score: number; weight: number; value: string }
    social: { score: number; weight: number; value: string }
    monetary: { score: number; weight: number; value: string }
    loyalty: { score: number; weight: number; value: string }
  }
  history: Array<{ date: string; score: number }>
  insights: string[]
}

export const mockFVSData = (): FVSData => {
  const score = randomInt(60, 95)
  return {
    score,
    trend: randomFloat(-5, 15, 1),
    breakdown: {
      streaming: { score: randomInt(70, 100), weight: 30, value: `${randomInt(50, 200)}K streams/month` },
      engagement: { score: randomInt(60, 95), weight: 25, value: `${randomFloat(3, 8, 1)}% engagement rate` },
      social: { score: randomInt(65, 90), weight: 20, value: `${randomInt(10, 50)}K followers` },
      monetary: { score: randomInt(50, 85), weight: 15, value: `€${randomInt(500, 5000)}/month` },
      loyalty: { score: randomInt(70, 95), weight: 10, value: `${randomInt(40, 80)}% repeat listeners` },
    },
    history: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: randomInt(score - 15, score + 5),
    })),
    insights: [
      'Streaming activity increased 23% in the last 30 days',
      'Social engagement peaked after Instagram Reels campaign',
      `Top spending fans concentrated in ${randomItem(cities).name}`,
      'Loyalty score above 85% indicates strong superfan base',
    ],
  }
}

// Superfan Mock Data
export interface Superfan {
  id: string
  name: string
  avatar?: string
  fvsScore: number
  totalStreams: number
  totalSpent: number
  firstSeen: string
  lastActive: string
  platforms: string[]
  topTracks: string[]
  location: { city: string; country: string }
  engagementLevel: 'platinum' | 'gold' | 'silver' | 'bronze'
  churnRisk: number
  recommendedActions: string[]
}

export const mockSuperfans = (count: number = 100): Superfan[] => {
  const levels: Superfan['engagementLevel'][] = ['platinum', 'gold', 'silver', 'bronze']
  const platforms = ['Spotify', 'Instagram', 'TikTok', 'YouTube', 'Twitter']
  const tracks = ['Hit Single', 'Album Track 1', 'Viral TikTok Song', 'Latest Release', 'Collaboration']

  return Array.from({ length: count }, (_, i) => ({
    id: `fan-${i + 1}`,
    name: `Fan ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
    fvsScore: randomInt(70, 100),
    totalStreams: randomInt(500, 10000),
    totalSpent: randomInt(50, 500),
    firstSeen: randomDate(new Date(2020, 0, 1), new Date(2023, 0, 1)).toISOString().split('T')[0],
    lastActive: randomDate(new Date(2024, 10, 1), new Date()).toISOString().split('T')[0],
    platforms: platforms.slice(0, randomInt(2, 5)),
    topTracks: tracks.slice(0, randomInt(2, 4)),
    location: randomItem(cities),
    engagementLevel: levels[Math.min(Math.floor(i / 25), 3)],
    churnRisk: randomInt(5, 60),
    recommendedActions: [
      'Send exclusive merch discount',
      'Invite to VIP meet & greet',
      'Share behind-the-scenes content',
    ].slice(0, randomInt(1, 3)),
  }))
}

// Release Optimizer Mock Data
export interface ReleaseOptimization {
  optimalDate: string
  optimalTime: string
  confidenceScore: number
  reasoning: string[]
  alternatives: Array<{ date: string; time: string; score: number }>
  heatmap: Array<{ day: string; hour: number; score: number }>
  conflicts: string[]
  marketAnalysis: {
    competitorReleases: number
    playlistRefreshes: string[]
    audienceActivity: string
  }
}

export const mockReleaseOptimization = (): ReleaseOptimization => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const optimalDay = 'Friday'
  const optimalHour = randomInt(0, 5)

  return {
    optimalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    optimalTime: `0${optimalHour}:00`,
    confidenceScore: randomInt(85, 98),
    reasoning: [
      'Friday releases capture weekend listening surge',
      'Spotify Release Radar updates on Fridays',
      'Low competitor activity in your genre this week',
      'Your audience peaks at midnight-2am on weekends',
      'Major playlist refreshes scheduled Thursday night',
    ],
    alternatives: [
      { date: '2024-12-06', time: '00:00', score: 94 },
      { date: '2024-12-13', time: '00:00', score: 92 },
      { date: '2024-12-20', time: '01:00', score: 88 },
    ],
    heatmap: days.flatMap((day) =>
      Array.from({ length: 24 }, (_, hour) => ({
        day,
        hour,
        score: day === optimalDay && hour <= 2 ? randomInt(85, 100) : randomInt(40, 85),
      }))
    ),
    conflicts: ['Major artist in same genre releasing Dec 13', 'Holiday season starts Dec 20 (lower engagement)'],
    marketAnalysis: {
      competitorReleases: randomInt(3, 15),
      playlistRefreshes: ['New Music Friday', 'Release Radar', 'Discover Weekly'],
      audienceActivity: 'Peak activity: Friday-Sunday 00:00-03:00',
    },
  }
}

// Revenue Forecasting Mock Data
export interface RevenueForecast {
  timeRange: number
  total: number
  breakdown: {
    streaming: { monthly: number[]; total: number; trend: number }
    concerts: { monthly: number[]; total: number; trend: number }
    merch: { monthly: number[]; total: number; trend: number }
    sync: { monthly: number[]; total: number; trend: number }
  }
  scenarios: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
  insights: string[]
}

export const mockRevenueForecast = (months: number = 12): RevenueForecast => {
  const generateMonthly = (base: number, growth: number) =>
    Array.from({ length: months }, (_, i) => Math.round(base * Math.pow(1 + growth, i)))

  const streaming = generateMonthly(randomInt(1000, 5000), randomFloat(0.03, 0.08))
  const concerts = generateMonthly(randomInt(500, 3000), randomFloat(0.05, 0.12))
  const merch = generateMonthly(randomInt(200, 1500), randomFloat(0.04, 0.1))
  const sync = generateMonthly(randomInt(100, 800), randomFloat(0.02, 0.06))

  const streamingTotal = streaming.reduce((a, b) => a + b, 0)
  const concertsTotal = concerts.reduce((a, b) => a + b, 0)
  const merchTotal = merch.reduce((a, b) => a + b, 0)
  const syncTotal = sync.reduce((a, b) => a + b, 0)

  const total = streamingTotal + concertsTotal + merchTotal + syncTotal

  return {
    timeRange: months,
    total,
    breakdown: {
      streaming: { monthly: streaming, total: streamingTotal, trend: 6.5 },
      concerts: { monthly: concerts, total: concertsTotal, trend: 8.2 },
      merch: { monthly: merch, total: merchTotal, trend: 7.1 },
      sync: { monthly: sync, total: syncTotal, trend: 4.3 },
    },
    scenarios: {
      optimistic: Math.round(total * 1.3),
      realistic: total,
      pessimistic: Math.round(total * 0.7),
    },
    insights: [
      'Concert revenue projected to grow 8.2% monthly',
      'Streaming stabilizing at €4.5K/month average',
      'Merch sales spike expected during tour dates',
      'Sync licensing opportunities increasing in Q2',
    ],
  }
}

// Scout Mode Mock Data
export interface ScoutArtist {
  id: string
  name: string
  genre: string[]
  potentialScore: number
  viralRisk: number
  isAIGenerated: boolean
  aiProbability: number
  followers: { spotify: number; instagram: number; tiktok: number }
  monthlyListeners: number
  engagementRate: number
  trendVelocity: number
  discoveredDate: string
  reasoning: string[]
  audioAnalysis?: {
    productionQuality: number
    genreTags: string[]
    aiMarkers: string[]
  }
}

export const mockScoutArtists = (count: number = 50): ScoutArtist[] => {
  return Array.from({ length: count }, (_, i) => {
    const isAI = Math.random() < 0.15 // 15% AI-generated
    const potentialScore = isAI ? randomInt(30, 70) : randomInt(60, 98)

    return {
      id: `scout-${i + 1}`,
      name: randomItem(artistNames) + ` ${i + 1}`,
      genre: [randomItem(genres), randomItem(genres)],
      potentialScore,
      viralRisk: randomInt(50, 95),
      isAIGenerated: isAI,
      aiProbability: isAI ? randomFloat(0.7, 0.95) : randomFloat(0.05, 0.3),
      followers: {
        spotify: randomInt(1000, 50000),
        instagram: randomInt(2000, 80000),
        tiktok: randomInt(5000, 200000),
      },
      monthlyListeners: randomInt(5000, 100000),
      engagementRate: randomFloat(2, 12, 1),
      trendVelocity: randomFloat(10, 150, 1),
      discoveredDate: randomDate(new Date(2024, 9, 1), new Date()).toISOString().split('T')[0],
      reasoning: [
        `${randomInt(100, 500)}% TikTok growth in 30 days`,
        'Early playlist placements on editorial',
        'High engagement rate vs followers',
        isAI ? '⚠️ AI-generated content detected' : 'Authentic human-created music',
      ],
      audioAnalysis: {
        productionQuality: randomInt(60, 95),
        genreTags: [randomItem(genres), randomItem(genres), randomItem(genres)],
        aiMarkers: isAI ? ['Repetitive patterns', 'Unnatural transitions', 'Synthetic vocals'] : [],
      },
    }
  })
}

// Demographics Mock Data
export interface Demographics {
  age: Record<string, number>
  gender: Record<string, number>
  countries: Array<{ country: string; percentage: number; fans: number }>
  cities: Array<{ city: string; country: string; fans: number; lat: number; lng: number }>
}

export const mockDemographics = (): Demographics => {
  const totalFans = randomInt(50000, 500000)

  return {
    age: {
      '13-17': randomInt(5, 15),
      '18-24': randomInt(30, 45),
      '25-34': randomInt(25, 35),
      '35-44': randomInt(10, 20),
      '45+': randomInt(5, 10),
    },
    gender: {
      male: randomInt(45, 65),
      female: randomInt(30, 50),
      other: randomInt(2, 5),
    },
    countries: [
      { country: 'France', percentage: randomInt(35, 50), fans: Math.round(totalFans * 0.45) },
      { country: 'USA', percentage: randomInt(15, 25), fans: Math.round(totalFans * 0.2) },
      { country: 'UK', percentage: randomInt(10, 15), fans: Math.round(totalFans * 0.12) },
      { country: 'Germany', percentage: randomInt(5, 10), fans: Math.round(totalFans * 0.08) },
      { country: 'Canada', percentage: randomInt(3, 8), fans: Math.round(totalFans * 0.05) },
    ],
    cities: cities.map((city) => ({
      ...city,
      fans: randomInt(1000, 15000),
    })),
  }
}

// Playlist Impact Mock Data
export interface PlaylistImpact {
  playlistName: string
  followers: number
  editorial: boolean
  placementDate: string
  streamsGenerated: number
  roi: number
  projections: Record<string, number>
  status: 'active' | 'removed'
}

export const mockPlaylistImpacts = (): PlaylistImpact[] => {
  return playlists.slice(0, 5).map((playlist) => {
    const streamsGenerated = randomInt(10000, 500000)
    const cost = randomInt(100, 5000)

    return {
      playlistName: playlist.name,
      followers: playlist.followers,
      editorial: playlist.editorial,
      placementDate: randomDate(new Date(2024, 8, 1), new Date()).toISOString().split('T')[0],
      streamsGenerated,
      roi: Math.round((streamsGenerated * 0.003 - cost) / cost * 100), // Rough ROI calc
      projections: {
        week_1: Math.round(streamsGenerated * 0.4),
        week_2: Math.round(streamsGenerated * 0.3),
        week_3: Math.round(streamsGenerated * 0.2),
        week_4: Math.round(streamsGenerated * 0.1),
      },
      status: Math.random() > 0.3 ? 'active' : 'removed',
    }
  })
}

// Tour Planning Mock Data
export interface TourSuggestion {
  city: string
  country: string
  lat: number
  lng: number
  fanConcentration: number
  venueCapacity: string
  estimatedRevenue: number
  seasonalScore: number
  reasoning: string[]
}

export const mockTourPlanning = (): TourSuggestion[] => {
  return cities.map((city) => {
    const fans = randomInt(1000, 20000)
    const ticketPrice = randomInt(20, 60)
    const capacity = fans > 10000 ? '1000-2000' : fans > 5000 ? '500-1000' : '200-500'
    const expectedAttendance = Math.round(fans * randomFloat(0.05, 0.15))

    return {
      ...city,
      fanConcentration: fans,
      venueCapacity: capacity,
      estimatedRevenue: expectedAttendance * ticketPrice,
      seasonalScore: randomInt(65, 95),
      reasoning: [
        `${fans.toLocaleString()} active fans in area`,
        `Expected ${expectedAttendance} attendees (${randomInt(5, 15)}% conversion)`,
        `Strong venue availability in ${randomItem(['Spring', 'Summer', 'Fall'])}`,
        `Low competition from similar artists`,
      ],
    }
  })
}

// Opportunity Alerts Mock Data
export type AlertType = 'playlist' | 'viral' | 'collab' | 'sync' | 'tour' | 'media' | 'trending'
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low'
export type AlertStatus = 'new' | 'read' | 'acted'

export interface OpportunityAlert {
  id: string
  type: AlertType
  priority: AlertPriority
  status: AlertStatus
  title: string
  description: string
  actionUrl?: string
  timestamp: string
  expiresAt?: string
  metadata?: {
    playlistName?: string
    artistName?: string
    platform?: string
    value?: number
  }
}

export const mockOpportunityAlerts = (count: number = 20): OpportunityAlert[] => {
  const alertTypes: AlertType[] = ['playlist', 'viral', 'collab', 'sync', 'tour', 'media', 'trending']
  const priorities: AlertPriority[] = ['critical', 'high', 'medium', 'low']
  const statuses: AlertStatus[] = ['new', 'read', 'acted']

  const templates: Record<AlertType, { titles: string[]; descriptions: string[] }> = {
    playlist: {
      titles: ['Editorial Playlist Opportunity', 'Playlist Curator Interest', 'Featured Playlist Spot'],
      descriptions: [
        'Your track "Summer Nights" fits perfectly with Today\'s Hits playlist (3.2M followers)',
        'Indie Vibes curator wants to add your latest single to their 500K follower playlist',
        'Spotify editorial team interested in featuring your music on New Music Friday',
      ],
    },
    viral: {
      titles: ['Viral Trend Detected', 'TikTok Explosion', 'Trending on Social Media'],
      descriptions: [
        'Your track is being used in 15K+ TikTok videos in the last 48 hours (+450% growth)',
        'Instagram Reels featuring your song grew 320% this week',
        'Trending hashtag #YourSongChallenge has 2.5M+ views',
      ],
    },
    collab: {
      titles: ['Collaboration Request', 'Feature Opportunity', 'Remix Request'],
      descriptions: [
        'Artist with 500K monthly listeners interested in collaboration',
        'Producer with platinum records wants to remix your track',
        'DJ requesting stems for official remix (150K followers)',
      ],
    },
    sync: {
      titles: ['Sync Licensing Opportunity', 'TV Show Interest', 'Commercial License Request'],
      descriptions: [
        'Netflix series producer interested in licensing your track for Season 3',
        'Major brand campaign seeking indie music (budget: €15K-€25K)',
        'Video game developer wants to feature your music (AAA title)',
      ],
    },
    tour: {
      titles: ['Tour Booking Offer', 'Festival Slot Available', 'Support Act Opportunity'],
      descriptions: [
        'Opening slot for major artist tour in Europe (20 dates, Summer 2025)',
        'Music festival in Berlin has last-minute slot available (June 15)',
        'Venue booking offer: 1000-capacity club in Paris (guaranteed €5K)',
      ],
    },
    media: {
      titles: ['Interview Request', 'Press Coverage', 'Radio Play Opportunity'],
      descriptions: [
        'Major music blog wants to feature your story (500K monthly readers)',
        'Radio station requesting interview for morning show (2M listeners)',
        'Podcast interview offer: Top 10 music industry podcast',
      ],
    },
    trending: {
      titles: ['Trending Alert', 'Breakout Moment', 'Momentum Spike'],
      descriptions: [
        'Your FVS score jumped 15 points in 24 hours - capitalize now!',
        'Fan engagement up 280% this week - perfect time for announcement',
        'Monthly listeners grew 45% - consider increasing ad spend',
      ],
    },
  }

  return Array.from({ length: count }, (_, i) => {
    const type = randomItem(alertTypes)
    const priority = randomItem(priorities)
    const status = i < 3 ? 'new' : randomItem(statuses)
    const template = templates[type]
    const title = randomItem(template.titles)
    const description = randomItem(template.descriptions)
    const hoursAgo = randomInt(0, 168) // 0-7 days
    const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

    const alert: OpportunityAlert = {
      id: `alert-${i + 1}`,
      type,
      priority,
      status,
      title,
      description,
      timestamp,
    }

    // Add expiration for time-sensitive opportunities
    if (['playlist', 'tour', 'media', 'sync'].includes(type)) {
      const daysUntilExpiry = randomInt(3, 14)
      alert.expiresAt = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000).toISOString()
    }

    // Add metadata
    if (type === 'playlist') {
      alert.metadata = {
        playlistName: randomItem(playlists).name,
        platform: 'Spotify',
      }
    } else if (type === 'collab') {
      alert.metadata = {
        artistName: randomItem(artistNames),
      }
    } else if (type === 'sync') {
      alert.metadata = {
        value: randomInt(10000, 50000),
      }
    }

    return alert
  })
}

// Social Media ROI Mock Data
export type SocialPlatform = 'instagram' | 'tiktok' | 'twitter' | 'youtube' | 'facebook'

export interface SocialMediaMetrics {
  platform: SocialPlatform
  followers: number
  followerGrowth: number
  engagement: {
    likes: number
    comments: number
    shares: number
    rate: number
  }
  posts: number
  reach: number
  impressions: number
  clickThroughRate: number
  conversions: {
    streams: number
    ticketsSold: number
    merchSales: number
  }
  adSpend: number
  revenue: number
  roi: number
  topContent: Array<{
    id: string
    type: 'post' | 'story' | 'reel' | 'video' | 'tweet'
    views: number
    engagement: number
    date: string
  }>
  weeklyStats: Array<{
    week: string
    followers: number
    engagement: number
    reach: number
  }>
}

export const mockSocialMediaROI = (): SocialMediaMetrics[] => {
  const platforms: SocialPlatform[] = ['instagram', 'tiktok', 'twitter', 'youtube', 'facebook']

  return platforms.map((platform) => {
    const followers = randomInt(10000, 500000)
    const posts = randomInt(20, 100)
    const reach = randomInt(followers * 0.3, followers * 1.5)
    const impressions = randomInt(reach * 1.5, reach * 3)
    const likes = randomInt(reach * 0.05, reach * 0.15)
    const comments = randomInt(likes * 0.05, likes * 0.2)
    const shares = randomInt(comments * 0.5, comments * 2)
    const engagementRate = randomFloat(2, 8, 2)

    const adSpend = randomInt(500, 5000)
    const streams = randomInt(1000, 50000)
    const ticketsSold = randomInt(10, 500)
    const merchSales = randomInt(50, 1000)
    const revenue = streams * 0.003 + ticketsSold * 30 + merchSales * 25
    const roi = Math.round((revenue - adSpend) / adSpend * 100)

    return {
      platform,
      followers,
      followerGrowth: randomFloat(-5, 25, 1),
      engagement: {
        likes,
        comments,
        shares,
        rate: engagementRate,
      },
      posts,
      reach,
      impressions,
      clickThroughRate: randomFloat(1, 5, 2),
      conversions: {
        streams,
        ticketsSold,
        merchSales,
      },
      adSpend,
      revenue: Math.round(revenue),
      roi,
      topContent: Array.from({ length: 5 }, (_, i) => ({
        id: `${platform}-content-${i + 1}`,
        type: platform === 'instagram' ? randomItem(['post', 'story', 'reel'] as const) :
              platform === 'tiktok' ? 'video' :
              platform === 'twitter' ? 'tweet' :
              'video',
        views: randomInt(10000, 500000),
        engagement: randomFloat(3, 12, 1),
        date: randomDate(new Date(2024, 9, 1), new Date()).toISOString().split('T')[0],
      })),
      weeklyStats: Array.from({ length: 8 }, (_, i) => ({
        week: `Week ${i + 1}`,
        followers: Math.round(followers - (7 - i) * followers * 0.02),
        engagement: randomFloat(2, 10, 1),
        reach: randomInt(reach * 0.7, reach * 1.3),
      })),
    }
  })
}

// AI Churn Prediction Mock Data
export interface ChurnPrediction {
  fanId: string
  fanName: string
  currentFVS: number
  predictedFVS: number
  churnRisk: number
  churnDate: string
  confidence: number
  factors: Array<{
    factor: string
    impact: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }>
  recommendedActions: string[]
  historicalPattern: Array<{
    date: string
    fvs: number
    churnRisk: number
  }>
}

export const mockChurnPredictions = (count: number = 20): ChurnPrediction[] => {
  const factors = [
    'Streaming frequency',
    'Last engagement',
    'Social media activity',
    'Concert attendance',
    'Merchandise purchases',
    'Playlist saves',
  ]

  return Array.from({ length: count }, (_, i) => {
    const currentFVS = randomInt(40, 90)
    const churnRisk = randomInt(20, 90)
    const predictedFVS = currentFVS - randomInt(10, 30)
    const daysUntilChurn = randomInt(15, 90)

    return {
      fanId: `fan-${i + 1}`,
      fanName: `${randomItem(artistNames)} Fan ${i + 1}`,
      currentFVS,
      predictedFVS: Math.max(20, predictedFVS),
      churnRisk,
      churnDate: new Date(Date.now() + daysUntilChurn * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confidence: randomFloat(75, 95, 1),
      factors: factors.slice(0, randomInt(3, 5)).map(factor => ({
        factor,
        impact: randomFloat(10, 40, 1),
        trend: randomItem(['increasing', 'decreasing', 'stable'] as const),
      })),
      recommendedActions: [
        'Send personalized email with exclusive content',
        'Offer early access to new release',
        'Target with social media ads',
        'Invite to virtual meet & greet',
      ].slice(0, randomInt(2, 4)),
      historicalPattern: Array.from({ length: 12 }, (_, j) => ({
        date: new Date(Date.now() - (11 - j) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fvs: randomInt(currentFVS - 20, currentFVS + 5),
        churnRisk: randomInt(churnRisk - 15, churnRisk + 10),
      })),
    }
  })
}

// AI Caption Generator Mock Data
export interface GeneratedCaption {
  id: string
  platform: 'instagram' | 'tiktok' | 'twitter' | 'facebook'
  caption: string
  hashtags: string[]
  tone: 'casual' | 'professional' | 'playful' | 'inspirational' | 'promotional'
  length: 'short' | 'medium' | 'long'
  emoji: boolean
  callToAction: string
  estimatedEngagement: number
  viralScore: number
}

export const mockCaptionGeneration = (context: string, platform: SocialPlatform, tone: string): GeneratedCaption[] => {
  const hashtagsByPlatform = {
    instagram: ['#NewMusic', '#IndieArtist', '#MusicProducer', '#InstaMusic', '#MusicLife'],
    tiktok: ['#fyp', '#viral', '#newmusic', '#artist', '#trending'],
    twitter: ['#NowPlaying', '#NewMusicFriday', '#IndieMusic', '#MusicPromotion'],
    youtube: ['#Subscribe', '#MusicVideo', '#NewRelease', '#Artist'],
    facebook: ['#Music', '#Live', '#Concert', '#NewAlbum'],
  }

  const captions = [
    `Just dropped something special 🎵 ${context}. Link in bio! What do you think?`,
    `New vibes incoming 🔥 ${context}. Stream now and let me know your favorite part!`,
    `This one's been in the vault for a minute... ${context} 🎶 Finally ready to share it with you all`,
    `Working on something big 💫 ${context}. Drop a 🔥 if you're ready for this`,
    `Late nights, early mornings, and a lot of coffee ☕ ${context}. Worth it? You tell me`,
  ]

  return Array.from({ length: 3 }, (_, i) => ({
    id: `caption-${i + 1}`,
    platform: platform as 'instagram' | 'tiktok' | 'twitter' | 'facebook',
    caption: randomItem(captions),
    hashtags: hashtagsByPlatform[platform] || [],
    tone: tone as 'casual' | 'professional' | 'playful' | 'inspirational' | 'promotional',
    length: randomItem(['short', 'medium', 'long'] as const),
    emoji: Math.random() > 0.3,
    callToAction: randomItem([
      'Link in bio',
      'Stream now',
      'Pre-save today',
      'Comment below',
      'Tag a friend',
    ]),
    estimatedEngagement: randomFloat(3, 12, 1),
    viralScore: randomInt(40, 95),
  }))
}

// AI Collaboration Finder Mock Data
export interface CollabMatch {
  artistId: string
  artistName: string
  genre: string[]
  followers: number
  monthlyListeners: number
  matchScore: number
  compatibility: {
    musical: number
    audience: number
    brand: number
    geographic: number
  }
  sharedAudience: number
  projectedReach: number
  estimatedROI: number
  reasoning: string[]
  previousCollabs: string[]
  availability: 'available' | 'busy' | 'interested'
}

export const mockCollabMatches = (count: number = 15): CollabMatch[] => {
  return Array.from({ length: count }, (_, i) => {
    const followers = randomInt(50000, 1000000)
    const monthlyListeners = randomInt(100000, 2000000)
    const matchScore = randomInt(60, 98)

    return {
      artistId: `collab-artist-${i + 1}`,
      artistName: `${randomItem(artistNames)} Artist ${i + 1}`,
      genre: [randomItem(genres), randomItem(genres)],
      followers,
      monthlyListeners,
      matchScore,
      compatibility: {
        musical: randomInt(70, 100),
        audience: randomInt(65, 95),
        brand: randomInt(60, 90),
        geographic: randomInt(55, 85),
      },
      sharedAudience: randomFloat(15, 45, 1),
      projectedReach: Math.round(monthlyListeners * randomFloat(1.3, 2.5)),
      estimatedROI: randomInt(150, 500),
      reasoning: [
        `${randomInt(15, 45)}% shared audience overlap`,
        'Similar musical style with complementary strengths',
        `Both trending in ${randomItem(cities).city} market`,
        'Compatible touring schedules for 2025',
      ],
      previousCollabs: Array.from({ length: randomInt(2, 5) }, () => randomItem(artistNames)),
      availability: randomItem(['available', 'busy', 'interested'] as const),
    }
  }).sort((a, b) => b.matchScore - a.matchScore)
}
