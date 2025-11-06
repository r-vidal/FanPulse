'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FVSDashboard from '@/components/analytics/FVSDashboard'

export default function FVSPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <FVSDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
