'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SocialMediaROI from '@/components/analytics/SocialMediaROI'

export default function SocialROIPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SocialMediaROI />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
