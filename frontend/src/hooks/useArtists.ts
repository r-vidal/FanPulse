import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { artistDetailApi, ArtistStats } from '@/lib/api/artistDetail'

/**
 * Artist interface matching backend response
 */
export interface Artist {
  id: string
  name: string
  spotify_id: string | null
  image_url: string | null
  genre: string | null
  current_momentum: number
  momentum_status: string
  total_streams: number
  total_superfans: number
  pending_actions: number
  trend_7d?: number | null
}

/**
 * Query keys for artists data
 */
export const artistKeys = {
  all: ['artists'] as const,
  lists: () => [...artistKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...artistKeys.lists(), filters] as const,
  details: () => [...artistKeys.all, 'detail'] as const,
  detail: (id: string) => [...artistKeys.details(), id] as const,
  stats: (id: string) => [...artistKeys.detail(id), 'stats'] as const,
  momentum: (id: string, days?: number) => [...artistKeys.detail(id), 'momentum', days] as const,
  topTracks: (id: string, limit?: number) => [...artistKeys.detail(id), 'top-tracks', limit] as const,
}

/**
 * Hook to fetch all artists with enriched stats
 */
export function useArtists() {
  return useQuery({
    queryKey: artistKeys.list(),
    queryFn: async (): Promise<Artist[]> => {
      const response = await api.get('/api/artists/')
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  })
}

/**
 * Hook to fetch a single artist's detailed stats
 */
export function useArtistStats(artistId: string | null | undefined) {
  return useQuery({
    queryKey: artistKeys.stats(artistId || ''),
    queryFn: () => artistDetailApi.getStats(artistId!),
    enabled: !!artistId, // Only fetch if artistId is provided
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch artist momentum history
 */
export function useArtistMomentum(artistId: string | null | undefined, days: number = 90) {
  return useQuery({
    queryKey: artistKeys.momentum(artistId || '', days),
    queryFn: () => artistDetailApi.getMomentumHistory(artistId!, days),
    enabled: !!artistId,
    staleTime: 60 * 1000, // Historical data changes less frequently
  })
}

/**
 * Hook to fetch artist top tracks
 */
export function useArtistTopTracks(artistId: string | null | undefined, limit: number = 10) {
  return useQuery({
    queryKey: artistKeys.topTracks(artistId || '', limit),
    queryFn: () => artistDetailApi.getTopTracks(artistId!, limit),
    enabled: !!artistId,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to create a new artist
 */
export function useCreateArtist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (artistData: Partial<Artist>) => {
      const response = await api.post('/api/artists/', artistData)
      return response.data
    },
    onSuccess: (newArtist) => {
      // Optimistically update the artists list
      queryClient.setQueryData<Artist[]>(artistKeys.list(), (old = []) => [...old, newArtist])
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: artistKeys.lists() })
    },
  })
}

/**
 * Hook to update an artist
 */
export function useUpdateArtist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ artistId, data }: { artistId: string; data: Partial<Artist> }) => {
      const response = await api.patch(`/api/artists/${artistId}`, data)
      return response.data
    },
    onMutate: async ({ artistId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: artistKeys.detail(artistId) })

      // Snapshot the previous value
      const previousArtist = queryClient.getQueryData(artistKeys.detail(artistId))

      // Optimistically update
      queryClient.setQueryData(artistKeys.detail(artistId), (old: any) => ({
        ...old,
        ...data,
      }))

      return { previousArtist }
    },
    onError: (err, { artistId }, context) => {
      // Rollback on error
      if (context?.previousArtist) {
        queryClient.setQueryData(artistKeys.detail(artistId), context.previousArtist)
      }
    },
    onSettled: (data, error, { artistId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: artistKeys.detail(artistId) })
      queryClient.invalidateQueries({ queryKey: artistKeys.lists() })
    },
  })
}

/**
 * Hook to delete an artist
 */
export function useDeleteArtist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (artistId: string) => {
      await api.delete(`/api/artists/${artistId}`)
    },
    onSuccess: (_, artistId) => {
      // Remove from lists
      queryClient.setQueryData<Artist[]>(artistKeys.list(), (old = []) =>
        old.filter((artist) => artist.id !== artistId)
      )
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: artistKeys.lists() })
      queryClient.removeQueries({ queryKey: artistKeys.detail(artistId) })
    },
  })
}

/**
 * Hook to manually refetch all artist data
 */
export function useRefreshArtists() {
  const queryClient = useQueryClient()

  return () => {
    return queryClient.invalidateQueries({
      queryKey: artistKeys.all,
    })
  }
}
