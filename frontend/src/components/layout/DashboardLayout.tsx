'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Home, Users, BarChart3, Settings, LogOut, Calendar, DollarSign, Key, FileText, Bell, Crown, ListTodo, Activity, Heart } from 'lucide-react'
import Button from '@/components/ui/Button'

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Actions', href: '/dashboard/actions', icon: ListTodo },
    { name: 'Momentum', href: '/dashboard/momentum', icon: Activity },
    { name: 'Superfans', href: '/dashboard/superfans', icon: Heart },
    { name: 'Artists', href: '/dashboard/artists', icon: Users },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  // PRO tier features
  const proNavigation = [
    { name: 'Release Optimizer', href: '/dashboard/releases', icon: Calendar },
    { name: 'Revenue Forecasting', href: '/dashboard/forecasts', icon: DollarSign },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  ]

  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'label' || user?.subscription_tier === 'enterprise'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b px-4">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">🎵 FanPulse</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2 transition-colors"
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}

          {/* PRO Features Section */}
          {isPro && (
            <>
              <div className="mt-6 mb-3 px-4 flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">
                  PRO Features
                </span>
              </div>
              {proNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-900 rounded-lg mb-2 transition-colors"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.subscription_tier} Plan</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </header>

        {/* Page content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
