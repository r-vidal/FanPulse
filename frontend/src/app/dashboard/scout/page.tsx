'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ScoutMode from '@/components/analytics/ScoutMode'

export default function ScoutModePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ScoutMode />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
