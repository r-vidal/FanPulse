'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import Alert from '@/components/ui/Alert'

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Message */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome to FanPulse! 🎵
            </h2>
            <p className="mt-2 text-gray-600">
              Music analytics platform for managers
            </p>
          </div>

          {/* Email Verification Notice */}
          {user && !user.is_verified && (
            <Alert type="warning" title="Email Not Verified">
              Please check your email to verify your account. Check your spam folder if you don't
              see it.
            </Alert>
          )}

          {/* Quick Stats Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Artists</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-2 text-sm text-gray-600">No artists added yet</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Streams</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">-</p>
              <p className="mt-2 text-sm text-gray-600">Add artists to track streams</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Average Momentum</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">-</p>
              <p className="mt-2 text-sm text-gray-600">Data available after setup</p>
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              🚀 Getting Started
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold mr-3">
                  1
                </span>
                <div>
                  <p className="font-medium text-blue-900">Add your first artist</p>
                  <p className="text-sm text-blue-700">
                    Connect Spotify, Instagram, and other platforms
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold mr-3">
                  2
                </span>
                <div>
                  <p className="font-medium text-blue-900">Configure integrations</p>
                  <p className="text-sm text-blue-700">
                    Set up API keys for data collection
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold mr-3">
                  3
                </span>
                <div>
                  <p className="font-medium text-blue-900">Start analyzing</p>
                  <p className="text-sm text-blue-700">
                    View momentum, superfans, and forecasts
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Coming Soon */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⏳ Coming Soon
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Momentum Index</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time tracking of artist growth trajectories
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Superfan Analysis</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Identify and engage with your top 100 fans
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Revenue Forecasting</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Predict income 3-12 months ahead
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Release Optimizer</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Find the best dates to release music
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
