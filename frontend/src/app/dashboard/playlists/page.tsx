'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PlaylistImpactTracker from '@/components/analytics/PlaylistImpactTracker'

export default function PlaylistsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PlaylistImpactTracker />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
