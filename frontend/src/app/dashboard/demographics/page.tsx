'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DemographicsDeepDive from '@/components/analytics/DemographicsDeepDive'

export default function DemographicsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DemographicsDeepDive />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
