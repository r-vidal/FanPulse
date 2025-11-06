'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AIToolsHub from '@/components/analytics/AIToolsHub'

export default function AIToolsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AIToolsHub />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
