'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { TrendingUp, Users, Zap, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsOverviewPage() {
  const router = useRouter()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Choose an analytics category to explore
            </p>
          </div>

          {/* Analytics Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Momentum Analytics */}
            <Link
              href="/dashboard/momentum"
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-8 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Momentum Index
                  </h2>
                  <p className="text-gray-700">
                    Track artist momentum scores, trends, and growth signals across all platforms
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <span>View Momentum Analytics</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Superfans Analytics */}
            <Link
              href="/dashboard/superfans"
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 p-8 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-purple-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Superfans
                  </h2>
                  <p className="text-gray-700">
                    Identify and engage with your most valuable fans based on FVS scores
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-purple-600 font-medium">
                <span>View Superfan Analytics</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Actions Analytics */}
            <Link
              href="/dashboard/actions"
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 p-8 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Next Best Actions
                  </h2>
                  <p className="text-gray-700">
                    AI-powered recommendations to maximize growth and engagement
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <span>View Action Insights</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Artist Details */}
            <Link
              href="/dashboard/artists"
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-8 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-orange-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Artist Deep Dive
                  </h2>
                  <p className="text-gray-700">
                    Comprehensive analytics for individual artists including tracks and performance
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-orange-600 font-medium">
                <span>View Artist Analytics</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Quick Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Pro Tip</h3>
                <p className="text-sm text-blue-800">
                  Start by checking your Momentum Index to identify which artists need immediate attention,
                  then review their Next Best Actions for specific growth strategies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
