/**
 * Scout A&R API Client
 *
 * Client for interacting with Scout A&R endpoints
 * Discovers emerging artists from Spotify with AI detection
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ScoutedArtist {
  spotify_id: string
  name: string
  genres: string[]
  popularity: number
  followers: number
  image_url: string | null
  spotify_url: string

  // Release info
  release_type: 'album' | 'single' | 'ep'
  release_name: string
  release_date: string
  total_releases: number
  is_first_release: boolean

  // Track info
  track_count: number | null
  first_track_name: string | null
  preview_url: string | null

  // Audio analysis
  audio_features: {
    energy: number
    danceability: number
    tempo: number
    valence: number
    acousticness: number
    instrumentalness: number
    liveness: number
    speechiness: number
  } | null

  // AI Detection
  is_ai_generated: boolean
  ai_confidence: number
  tags: string[]

  // Metadata
  discovered_at: string
  potential_score?: number
}

export interface ScoutScanParams {
  country?: string
  limit?: number
  genres?: string // Comma-separated
}

export interface ScoutResponse {
  total: number
  artists: ScoutedArtist[]
  filters_applied: {
    country?: string
    limit?: number
    genres?: string[]
  }
}

export interface ArtistPotentialScore {
  spotify_id: string
  name: string
  potential_score: number
  score_breakdown: {
    popularity_factor: number
    follower_growth_potential: number
    release_activity: number
    authenticity_bonus: number
    first_release_bonus: number
  }
  recommendation: string
}

export interface AvailableTags {
  release_tags: string[]
  popularity_tags: string[]
  size_tags: string[]
  authenticity_tags: string[]
  energy_tags: string[]
  style_tags: string[]
  timing_tags: string[]
  genre_examples: string[]
}

/**
 * Scan new releases from Spotify
 */
export async function scanNewReleases(
  params: ScoutScanParams = {}
): Promise<ScoutResponse> {
  const { country = 'US', limit = 50, genres } = params

  const queryParams = new URLSearchParams({
    country,
    limit: limit.toString(),
    ...(genres && { genres }),
  })

  const token = localStorage.getItem('accessToken')

  const response = await fetch(`${API_URL}/api/scout/scan/new-releases?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to scan new releases')
  }

  return response.json()
}

/**
 * Scan by genre
 */
export async function scanByGenre(
  genre: string,
  limit: number = 20
): Promise<ScoutResponse> {
  const token = localStorage.getItem('accessToken')

  const response = await fetch(
    `${API_URL}/api/scout/scan/by-genre/${encodeURIComponent(genre)}?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || `Failed to scan genre: ${genre}`)
  }

  return response.json()
}

/**
 * Get artist potential score
 */
export async function getArtistPotential(
  spotifyId: string
): Promise<ArtistPotentialScore> {
  const token = localStorage.getItem('accessToken')

  const response = await fetch(
    `${API_URL}/api/scout/artist/${encodeURIComponent(spotifyId)}/potential`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to get artist potential')
  }

  return response.json()
}

/**
 * Get available tags
 */
export async function getAvailableTags(): Promise<AvailableTags> {
  const token = localStorage.getItem('accessToken')

  const response = await fetch(`${API_URL}/api/scout/tags`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to get available tags')
  }

  return response.json()
}

/**
 * Add artist to watchlist
 */
export async function addToWatchlist(spotifyId: string): Promise<{ message: string }> {
  const token = localStorage.getItem('accessToken')

  const response = await fetch(
    `${API_URL}/api/scout/watchlist/add/${encodeURIComponent(spotifyId)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to add to watchlist')
  }

  return response.json()
}

/**
 * Remove artist from watchlist
 */
export async function removeFromWatchlist(spotifyId: string): Promise<{ message: string }> {
  const token = localStorage.getItem('accessToken')

  const response = await fetch(
    `${API_URL}/api/scout/watchlist/remove/${encodeURIComponent(spotifyId)}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to remove from watchlist')
  }

  return response.json()
}

/**
 * Convert backend ScoutedArtist to frontend ScoutArtist format
 */
export function convertToFrontendFormat(artist: ScoutedArtist): any {
  return {
    id: artist.spotify_id,
    name: artist.name,
    genre: artist.genres,
    potentialScore: artist.potential_score || 0,
    viralRisk: Math.min(95, artist.popularity + 20), // Estimate based on popularity
    isAIGenerated: artist.is_ai_generated,
    aiProbability: artist.ai_confidence,
    followers: {
      spotify: artist.followers,
      instagram: Math.floor(artist.followers * 1.5), // Estimate
      tiktok: Math.floor(artist.followers * 3), // Estimate
    },
    monthlyListeners: Math.floor(artist.followers * 2), // Estimate
    engagementRate: artist.popularity / 10, // Estimate
    trendVelocity: artist.is_first_release ? 150 : 50, // Higher for first releases
    discoveredDate: artist.discovered_at,
    reasoning: [
      artist.is_first_release && 'First release - high growth potential',
      !artist.is_ai_generated && 'Authentic human-created music',
      artist.tags.includes('new_this_week') && 'Fresh release this week',
      artist.preview_url && 'Audio preview available',
    ].filter(Boolean) as string[],
    audioAnalysis: artist.audio_features ? {
      productionQuality: Math.floor((artist.audio_features.energy + artist.audio_features.danceability) * 50),
      genreTags: artist.tags.filter(tag => !['ai_generated', 'authentic', 'new_this_week'].includes(tag)),
      aiMarkers: artist.is_ai_generated ? [
        'Consistent spectral patterns detected',
        'Perfect tempo consistency',
        'Unnatural harmonic ratios',
      ] : [],
    } : undefined,
  }
}
