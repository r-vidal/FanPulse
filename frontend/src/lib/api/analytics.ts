/**
 * Analytics API Client
 *
 * Client for interacting with analytics endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface FVSData {
  fvs: number
  breakdown: {
    engagement: { score: number; weight: number; contribution: number }
    growth: { score: number; weight: number; contribution: number }
    reach: { score: number; weight: number; contribution: number }
    conversion: { score: number; weight: number; contribution: number }
  }
  calculated_at: string
  period_days: number
}

export interface MomentumData {
  momentum_index: number
  status: string
  trend: string
  breakdown: {
    velocity: number
    acceleration: number
    consistency: number
    viral_potential: number
  }
  calculated_at: string
  period_days: number
  data_points: number
}

export interface BreakoutPrediction {
  prediction: string
  probability: number
  indicators: {
    accelerating_growth: boolean
    viral_content: boolean
    high_velocity: boolean
    consistent_growth: boolean
  }
  momentum_index: number
  recommendation: string
}

export interface SuperfanInsights {
  total_superfans: number
  active_last_30_days: number
  activity_rate: number
  tier_distribution: {
    platinum: number
    gold: number
    silver: number
    bronze: number
  }
  average_lifetime_value: number
  average_engagement_score: number
  total_lifetime_value: number
  top_locations: Array<{ location: string; count: number }>
  calculated_at: string
}

export interface ArtistOverview {
  artist_id: string
  artist_name: string
  fvs: FVSData | null
  momentum: MomentumData | null
  superfan_count: number
  platform_count: number
  total_followers: number
  total_monthly_listeners: number
}

/**
 * Get Fan Value Score for an artist
 */
export async function getFVS(
  artistId: string,
  days: number = 30,
  token: string
): Promise<FVSData> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/fvs?days=${days}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch FVS data')
  }

  return response.json()
}

/**
 * Get FVS trend over time
 */
export async function getFVSTrend(
  artistId: string,
  months: number = 6,
  token: string
): Promise<{ artist_id: string; artist_name: string; trend: any[] }> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/fvs/trend?months=${months}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch FVS trend')
  }

  return response.json()
}

/**
 * Get Momentum Index for an artist
 */
export async function getMomentum(
  artistId: string,
  days: number = 30,
  token: string
): Promise<MomentumData> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/momentum?days=${days}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch momentum data')
  }

  return response.json()
}

/**
 * Get momentum trend over time
 */
export async function getMomentumTrend(
  artistId: string,
  weeks: number = 12,
  token: string
): Promise<{ artist_id: string; artist_name: string; trend: any[] }> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/momentum/trend?weeks=${weeks}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch momentum trend')
  }

  return response.json()
}

/**
 * Get breakout prediction for an artist
 */
export async function getBreakoutPrediction(
  artistId: string,
  token: string
): Promise<BreakoutPrediction> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/breakout`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch breakout prediction')
  }

  return response.json()
}

/**
 * Get superfan insights
 */
export async function getSuperfanInsights(
  artistId: string,
  token: string
): Promise<SuperfanInsights> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/superfans`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch superfan insights')
  }

  return response.json()
}

/**
 * Get list of superfans
 */
export async function getSuperfanList(
  artistId: string,
  minScore: number = 7.0,
  days: number = 90,
  token: string
): Promise<any> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/superfans/list?min_score=${minScore}&days=${days}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch superfan list')
  }

  return response.json()
}

/**
 * Get superfan segments
 */
export async function getSuperfanSegments(
  artistId: string,
  token: string
): Promise<any> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/superfans/segments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch superfan segments')
  }

  return response.json()
}

/**
 * Get churn risk analysis
 */
export async function getChurnRisk(
  artistId: string,
  token: string
): Promise<any> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/superfans/churn-risk`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch churn risk')
  }

  return response.json()
}

/**
 * Get comprehensive artist overview
 */
export async function getArtistOverview(
  artistId: string,
  token: string
): Promise<ArtistOverview> {
  const response = await fetch(
    `${API_URL}/api/analytics/${artistId}/overview`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch artist overview')
  }

  return response.json()
}
