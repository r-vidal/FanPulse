'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Home, Users, BarChart3, Settings, LogOut, Calendar, DollarSign, Key, FileText, Bell, Crown, ListTodo, Activity, Heart, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import CommandPalette from '@/components/ui/CommandPalette'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useCommandPalette } from '@/hooks/useCommandPalette'

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { isOpen, setIsOpen } = useCommandPalette()

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Command Palette */}
      <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-lg border-r dark:border-gray-800">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b dark:border-gray-800 px-4">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">🎵 FanPulse</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mb-2 transition-colors"
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
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-900 dark:hover:text-yellow-400 rounded-lg mb-2 transition-colors"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-800">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.subscription_tier} Plan</p>
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
        <header className="bg-white dark:bg-gray-900 shadow-sm h-16 flex items-center justify-between px-8 border-b dark:border-gray-800">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">FanPulse</h1>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Search Command Palette Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-1.5 text-xs font-mono text-gray-600 dark:text-gray-400">
                ⌘K
              </kbd>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
