'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TourPlanningIntelligence from '@/components/analytics/TourPlanningIntelligence'

export default function TourPlanningPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <TourPlanningIntelligence />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
