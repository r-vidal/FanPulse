import { api } from '../api'

export interface Artist {
  id: string
  name: string
  genre: string | null
  spotify_id: string | null
  instagram_id: string | null
  youtube_id: string | null
  image_url: string | null
  created_at: string
}

export interface CreateArtistRequest {
  name: string
  genre?: string
  spotify_id?: string
  instagram_id?: string
  youtube_id?: string
  image_url?: string
}

export const artistsApi = {
  /**
   * Get all artists for the current user
   */
  getAll: async (): Promise<Artist[]> => {
    const response = await api.get('/api/artists/')
    return response.data
  },

  /**
   * Get a specific artist by ID
   */
  getById: async (artistId: string): Promise<Artist> => {
    const response = await api.get(`/api/artists/${artistId}`)
    return response.data
  },

  /**
   * Create a new artist
   */
  create: async (data: CreateArtistRequest): Promise<Artist> => {
    const response = await api.post('/api/artists/', data)
    return response.data
  },

  /**
   * Delete an artist
   */
  delete: async (artistId: string): Promise<void> => {
    await api.delete(`/api/artists/${artistId}`)
  },

  /**
   * Search Spotify for artists
   */
  searchSpotify: async (query: string): Promise<any[]> => {
    const response = await api.get('/api/artists/search/spotify', {
      params: { query }
    })
    return response.data
  },

  /**
   * Import an artist from Spotify
   */
  importFromSpotify: async (spotifyId: string): Promise<Artist> => {
    const response = await api.post('/api/artists/import/spotify', {
      spotify_id: spotifyId
    })
    return response.data
  }
}
