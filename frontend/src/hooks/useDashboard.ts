import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardApi, DashboardStats, TopArtist, RecentActivity } from '@/lib/api/dashboard'

/**
 * Query keys for dashboard data
 * Organized hierarchically for efficient cache invalidation
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (artistId?: string) => [...dashboardKeys.all, 'stats', artistId ?? 'all'] as const,
  topPerformers: (limit: number, artistId?: string) =>
    [...dashboardKeys.all, 'top-performers', limit, artistId ?? 'all'] as const,
  recentActivity: (limit: number, artistId?: string) =>
    [...dashboardKeys.all, 'recent-activity', limit, artistId ?? 'all'] as const,
}

/**
 * Hook to fetch dashboard statistics
 * Automatically caches and refetches data based on QueryClient configuration
 */
export function useDashboardStats(artistId?: string) {
  return useQuery({
    queryKey: dashboardKeys.stats(artistId),
    queryFn: () => dashboardApi.getStats(artistId),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 60 * 1000, // Auto-refetch every minute for real-time feel
  })
}

/**
 * Hook to fetch top performing artists
 */
export function useTopPerformers(limit: number = 5, artistId?: string) {
  return useQuery({
    queryKey: dashboardKeys.topPerformers(limit, artistId),
    queryFn: () => dashboardApi.getTopPerformers(limit, artistId),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

/**
 * Hook to fetch recent activity
 */
export function useRecentActivity(limit: number = 10, artistId?: string) {
  return useQuery({
    queryKey: dashboardKeys.recentActivity(limit, artistId),
    queryFn: () => dashboardApi.getRecentActivity(limit, artistId),
    staleTime: 20 * 1000, // More frequent updates for activity feed
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })
}

/**
 * Hook to manually refetch all dashboard data
 * Useful for pull-to-refresh or after major updates
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient()

  return () => {
    return queryClient.invalidateQueries({
      queryKey: dashboardKeys.all,
    })
  }
}
