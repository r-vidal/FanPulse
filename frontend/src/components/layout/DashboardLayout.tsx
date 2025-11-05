'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import {
  Home, Users, BarChart3, Settings, LogOut, Calendar, DollarSign,
  Key, FileText, Bell, Crown, ListTodo, Activity, Heart, Search,
  Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import Button from '@/components/ui/Button'
import CommandPalette from '@/components/ui/CommandPalette'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useCommandPalette } from '@/hooks/useCommandPalette'

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { isOpen, setIsOpen } = useCommandPalette()

  // Sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved) {
      setSidebarCollapsed(saved === 'true')
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Navigation groups
  const coreNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, exact: true },
    { name: 'Actions', href: '/dashboard/actions', icon: ListTodo },
  ]

  const analyticsNavigation = [
    { name: 'Momentum', href: '/dashboard/momentum', icon: Activity },
    { name: 'Superfans', href: '/dashboard/superfans', icon: Heart },
    { name: 'Artists', href: '/dashboard/artists', icon: Users },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  ]

  const proNavigation = [
    { name: 'Release Optimizer', href: '/dashboard/releases', icon: Calendar },
    { name: 'Revenue Forecasting', href: '/dashboard/forecasts', icon: DollarSign },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  ]

  const adminNavigation = [
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'label' || user?.subscription_tier === 'enterprise'

  // Helper to check if route is active
  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  // Nav Link Component
  const NavLink = ({ item, collapsed = false }: { item: any; collapsed?: boolean }) => {
    const active = isActive(item.href, item.exact)

    return (
      <Link
        href={item.href}
        className={`
          flex items-center px-4 py-3 rounded-lg mb-1 transition-all
          ${active
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
        title={collapsed ? item.name : undefined}
      >
        <item.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    )
  }

  // Section Header Component
  const SectionHeader = ({ title, collapsed = false }: { title: string; collapsed?: boolean }) => {
    if (collapsed) return <div className="h-px bg-gray-200 dark:bg-gray-700 my-4 mx-4" />

    return (
      <div className="px-4 mb-2 mt-6">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
      </div>
    )
  }

  // Sidebar Content
  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b dark:border-gray-800 px-4">
        <Link href="/dashboard" className="flex items-center">
          {collapsed ? (
            <span className="text-2xl">🎵</span>
          ) : (
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">🎵 FanPulse</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Core */}
        {coreNavigation.map((item) => (
          <NavLink key={item.name} item={item} collapsed={collapsed} />
        ))}

        {/* Analytics */}
        <SectionHeader title="Analytics" collapsed={collapsed} />
        {analyticsNavigation.map((item) => (
          <NavLink key={item.name} item={item} collapsed={collapsed} />
        ))}

        {/* PRO Features */}
        {isPro && (
          <>
            <div className={`mt-6 mb-3 px-4 flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
              <Crown className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              {!collapsed && (
                <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">
                  PRO
                </span>
              )}
            </div>
            {proNavigation.map((item) => (
              <NavLink key={item.name} item={item} collapsed={collapsed} />
            ))}
          </>
        )}

        {/* Admin */}
        <SectionHeader title="Admin" collapsed={collapsed} />
        {adminNavigation.map((item) => (
          <NavLink key={item.name} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User info & Logout - Sticky Bottom */}
      <div className="sticky bottom-0 left-0 right-0 p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
        {!collapsed && (
          <div className="mb-3 px-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.subscription_tier} Plan</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start'}`}
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Command Palette */}
      <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg border-r dark:border-gray-800
          transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent collapsed={false} />
      </div>

      {/* Sidebar - Desktop */}
      <div
        className={`
          hidden lg:flex lg:flex-col fixed inset-y-0 left-0 bg-white dark:bg-gray-900 shadow-lg border-r dark:border-gray-800
          transition-all duration-300 ease-in-out z-30
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <SidebarContent collapsed={sidebarCollapsed} />

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Main content */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}
      >
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 shadow-sm h-16 flex items-center justify-between px-4 lg:px-8 border-b dark:border-gray-800 sticky top-0 z-20">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="text-xl font-semibold text-gray-900 dark:text-white hidden lg:block">FanPulse</h1>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white lg:hidden">🎵</h1>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Search Command Palette Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden xl:inline-flex h-5 items-center gap-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-1.5 text-xs font-mono text-gray-600 dark:text-gray-400">
                ⌘K
              </kbd>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
