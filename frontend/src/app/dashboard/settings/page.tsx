'use client'

/**
 * Settings Page - Complete configuration center
 *
 * Sections:
 * 1. Profile - User info, company details
 * 2. Notifications - Email, push, alerts preferences
 * 3. Platforms - Connected accounts (Spotify, Instagram, etc.)
 * 4. Billing - Subscription, payment, invoices
 */

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { useSubscription } from '@/contexts/SubscriptionContext'
import PlanComparison from '@/components/settings/PlanComparison'
import {
  User,
  Bell,
  Link as LinkIcon,
  CreditCard,
  Shield,
  Settings as SettingsIcon,
  Sparkles,
  Zap,
  Crown,
  Loader2,
  Check,
  X
} from 'lucide-react'

type Tab = 'profile' | 'notifications' | 'platforms' | 'billing' | 'security'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const tabs = [
    { id: 'profile' as Tab, name: 'Profile', icon: User },
    { id: 'notifications' as Tab, name: 'Notifications', icon: Bell },
    { id: 'platforms' as Tab, name: 'Platforms', icon: LinkIcon },
    { id: 'billing' as Tab, name: 'Billing', icon: CreditCard },
    { id: 'security' as Tab, name: 'Security', icon: Shield },
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Settings
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                      transition-colors
                      ${
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="pb-12">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'notifications' && <NotificationsSection />}
            {activeTab === 'platforms' && <PlatformsSection />}
            {activeTab === 'billing' && <BillingSection />}
            {activeTab === 'security' && <SecuritySection />}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// Profile Section Component
function ProfileSection() {
  const { user } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [company, setCompany] = useState('')
  const [website, setWebsite] = useState('')
  const [timezone, setTimezone] = useState('Europe/Paris')

  const handleSave = () => {
    // TODO: Implement profile update
    console.log('Save profile:', { name, email, company, website, timezone })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Profile Information</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Update your account profile and personal details
        </p>
      </div>

      {/* Photo */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              Upload Photo
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company / Label Name
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Optional"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Website
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
            <option value="America/New_York">America/New York (EST)</option>
            <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

// Notifications Section Component
function NotificationsSection() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Notification Preferences</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose how you want to receive alerts and updates
        </p>
      </div>

      {/* Email Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Email Notifications</h3>
        <div className="space-y-3">
          <NotificationToggle
            label="Daily Digest"
            description="Summary of key metrics and actions every morning"
            defaultChecked={true}
          />
          <NotificationToggle
            label="Weekly Report"
            description="Comprehensive weekly performance report"
            defaultChecked={true}
          />
          <NotificationToggle
            label="Product Updates"
            description="News about new features and improvements"
            defaultChecked={false}
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Push Notifications</h3>
        <div className="space-y-3">
          <NotificationToggle
            label="Desktop Notifications"
            description="Receive alerts on your desktop browser"
            defaultChecked={false}
          />
          <NotificationToggle
            label="Mobile Push"
            description="Get notifications on your mobile device"
            defaultChecked={false}
          />
        </div>
      </div>

      {/* Alert Types */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Alert Types</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select which alerts you want to receive
        </p>
        <div className="space-y-3">
          <NotificationToggle label="🔥 Viral Spike" defaultChecked={true} />
          <NotificationToggle label="📉 Momentum Drop" defaultChecked={true} />
          <NotificationToggle label="🎵 Playlist Add/Remove" defaultChecked={true} />
          <NotificationToggle label="👥 Fan Spike" defaultChecked={true} />
          <NotificationToggle label="💬 Engagement Crash" defaultChecked={true} />
          <NotificationToggle label="🎯 Competitor Move" defaultChecked={false} />
          <NotificationToggle label="⏰ Best Time to Post" defaultChecked={true} />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Save Preferences
        </button>
      </div>
    </div>
  )
}

// Platforms Section Component
function PlatformsSection() {
  const [platforms, setPlatforms] = useState([
    {
      id: 'spotify',
      name: 'Spotify for Artists',
      icon: '🎵',
      status: 'connected' as const,
      description: 'Streams, listeners, playlist data',
      tier: 'All tiers',
      lastSync: new Date(),
      dataPoints: ['Streams', 'Listeners', 'Playlists', 'Demographics'],
      connectedEmail: 'artist@example.com'
    },
    {
      id: 'instagram',
      name: 'Instagram Business',
      icon: '📸',
      status: 'connected' as const,
      description: 'Posts, engagement, audience insights',
      tier: 'All tiers',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      dataPoints: ['Posts', 'Engagement', 'Stories', 'Followers'],
      connectedEmail: '@artist_handle'
    },
    {
      id: 'tiktok',
      name: 'TikTok Creator',
      icon: '🎬',
      status: 'not_connected' as const,
      description: 'Video analytics, sound tracking',
      tier: 'PRO',
      lastSync: null,
      dataPoints: ['Video Views', 'Likes', 'Shares', 'Sound Usage'],
      connectedEmail: null
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '▶️',
      status: 'not_connected' as const,
      description: 'Video performance, subscribers',
      tier: 'PRO',
      lastSync: null,
      dataPoints: ['Views', 'Subscribers', 'Watch Time', 'Revenue'],
      connectedEmail: null
    },
    {
      id: 'apple_music',
      name: 'Apple Music for Artists',
      icon: '🍎',
      status: 'not_connected' as const,
      description: 'Streams, Shazam, radio plays',
      tier: 'PRO',
      lastSync: null,
      dataPoints: ['Streams', 'Shazams', 'Radio Plays', 'Playlists'],
      connectedEmail: null
    },
    {
      id: 'deezer',
      name: 'Deezer for Creators',
      icon: '🎧',
      status: 'not_connected' as const,
      description: 'Streaming analytics, fans data',
      tier: 'ENTERPRISE',
      lastSync: null,
      dataPoints: ['Streams', 'Fans', 'Playlists', 'Countries'],
      connectedEmail: null
    }
  ])

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null)

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId)
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 2000))
    setPlatforms(prev => prev.map(p =>
      p.id === platformId
        ? { ...p, status: 'connected' as const, lastSync: new Date(), connectedEmail: 'connected@example.com' }
        : p
    ))
    setConnectingPlatform(null)
  }

  const handleDisconnect = async (platformId: string) => {
    if (!confirm('Are you sure you want to disconnect this platform? Historical data will be preserved but live syncing will stop.')) {
      return
    }
    setDisconnectingPlatform(platformId)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setPlatforms(prev => prev.map(p =>
      p.id === platformId
        ? { ...p, status: 'not_connected' as const, lastSync: null, connectedEmail: null }
        : p
    ))
    setDisconnectingPlatform(null)
  }

  const handleRefreshSync = async (platformId: string) => {
    setPlatforms(prev => prev.map(p =>
      p.id === platformId
        ? { ...p, lastSync: new Date() }
        : p
    ))
  }

  const connectedCount = platforms.filter(p => p.status === 'connected').length

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connected Platforms</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your connected streaming and social media accounts
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{connectedCount}/{platforms.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Platforms Connected</div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Why connect platforms?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              FanPulse automatically syncs your data every 6 hours to provide real-time analytics, AI insights, and momentum tracking across all your channels.
            </p>
          </div>
        </div>
      </div>

      {/* Connected Platforms */}
      <div className="space-y-4">
        {platforms.map((platform) => (
          <EnhancedPlatformCard
            key={platform.id}
            platform={platform}
            onConnect={() => handleConnect(platform.id)}
            onDisconnect={() => handleDisconnect(platform.id)}
            onRefresh={() => handleRefreshSync(platform.id)}
            isConnecting={connectingPlatform === platform.id}
            isDisconnecting={disconnectingPlatform === platform.id}
          />
        ))}
      </div>
    </div>
  )
}

// Billing Section Component
function BillingSection() {
  const [showComparison, setShowComparison] = useState(false)

  return (
    <div className="max-w-5xl space-y-6">
      {!showComparison ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Billing & Subscription</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your subscription and payment methods
              </p>
            </div>
            <button
              onClick={() => setShowComparison(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              View All Plans
            </button>
          </div>

          <CurrentPlanCard onViewPlans={() => setShowComparison(true)} />

          {/* Usage Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Usage This Month</h3>
            <UsageStats />
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Visa •••• 4242</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Expires 12/2025</p>
                </div>
              </div>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Update
              </button>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Invoices</h3>
            <div className="space-y-3">
              <InvoiceRow date="Nov 1, 2025" amount="€199.00" status="paid" />
              <InvoiceRow date="Oct 1, 2025" amount="€199.00" status="paid" />
              <InvoiceRow date="Sep 1, 2025" amount="€199.00" status="paid" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">All Plans</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Compare and switch between plans
              </p>
            </div>
            <button
              onClick={() => setShowComparison(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 text-sm font-medium"
            >
              Back to Billing
            </button>
          </div>
          <PlanComparisonWrapper />
        </>
      )}
    </div>
  )
}

// Security Section Component
function SecuritySection() {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessions, setSessions] = useState([
    {
      id: '1',
      device: 'Chrome on macOS',
      location: 'Paris, France',
      ip: '91.168.1.1',
      lastActive: new Date(),
      current: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'Paris, France',
      ip: '91.168.1.2',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      current: false
    },
    {
      id: '3',
      device: 'Firefox on Windows',
      location: 'Lyon, France',
      ip: '82.122.45.78',
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
      current: false
    }
  ])

  const [securityLogs] = useState([
    { id: '1', action: 'Password changed', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), success: true },
    { id: '2', action: 'Login from new device', timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), success: true },
    { id: '3', action: 'Failed login attempt', timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), success: false },
  ])

  const handleRevokeSession = (sessionId: string) => {
    if (confirm('Are you sure you want to revoke this session? You will need to log in again from that device.')) {
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Security Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your account security and login sessions
        </p>
      </div>

      {/* Security Score */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-500 dark:border-green-600 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-1">Security Score</h3>
            <p className="text-sm text-green-700 dark:text-green-400">Your account is well protected</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-900 dark:text-green-300">85%</div>
            <div className="text-xs text-green-700 dark:text-green-400">Strong</div>
          </div>
        </div>
        <div className="space-y-2">
          <SecurityCheckItem label="Strong password" checked={true} />
          <SecurityCheckItem label="Two-factor authentication" checked={twoFactorEnabled} />
          <SecurityCheckItem label="Email verified" checked={true} />
          <SecurityCheckItem label="Recent security review" checked={true} />
        </div>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last changed 30 days ago • We recommend changing your password every 90 days
            </p>
          </div>
          <Shield className="w-8 h-8 text-gray-400" />
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Change Password
        </button>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</h3>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                twoFactorEnabled
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
              }`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add an extra layer of security to your account with authenticator app (Google Authenticator, Authy)
            </p>
          </div>
        </div>
        {!twoFactorEnabled ? (
          <button
            onClick={() => setShow2FAModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Enable 2FA
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✓ Two-factor authentication is active. You'll need your authenticator app to log in.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 text-sm font-medium">
                View Recovery Codes
              </button>
              <button
                onClick={() => setTwoFactorEnabled(false)}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium"
              >
                Disable 2FA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Active Sessions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage devices currently logged into your account
            </p>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{sessions.length} sessions</span>
        </div>
        <div className="space-y-3">
          {sessions.map((session) => (
            <EnhancedSessionRow
              key={session.id}
              session={session}
              onRevoke={() => handleRevokeSession(session.id)}
            />
          ))}
        </div>
      </div>

      {/* Security Activity Log */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Security Activity</h3>
        <div className="space-y-3">
          {securityLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {log.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-medium ${log.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {log.success ? 'Success' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View full security log
        </button>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <TwoFactorSetupModal
          onClose={() => setShow2FAModal(false)}
          onComplete={() => {
            setTwoFactorEnabled(true)
            setShow2FAModal(false)
          }}
        />
      )}
    </div>
  )
}

// Helper Components

// Current Plan Card Component
function CurrentPlanCard({ onViewPlans }: { onViewPlans: () => void }) {
  const { currentPlan, currentTier } = useSubscription()

  const getPlanIcon = () => {
    switch (currentTier) {
      case 'free':
        return <Sparkles className="w-6 h-6" />
      case 'pro':
        return <Zap className="w-6 h-6" />
      case 'enterprise':
        return <Crown className="w-6 h-6" />
    }
  }

  const getPlanColor = () => {
    switch (currentTier) {
      case 'free':
        return {
          bg: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-900 dark:text-blue-100',
          subtext: 'text-blue-700 dark:text-blue-300',
          icon: 'bg-blue-600',
        }
      case 'pro':
        return {
          bg: 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30',
          border: 'border-purple-200 dark:border-purple-800',
          text: 'text-purple-900 dark:text-purple-100',
          subtext: 'text-purple-700 dark:text-purple-300',
          icon: 'bg-purple-600',
        }
      case 'enterprise':
        return {
          bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-900 dark:text-yellow-100',
          subtext: 'text-yellow-700 dark:text-yellow-300',
          icon: 'bg-yellow-600',
        }
    }
  }

  const colors = getPlanColor()

  return (
    <div className={`bg-gradient-to-br ${colors.bg} rounded-lg border ${colors.border} p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center text-white`}>
            {getPlanIcon()}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${colors.text} uppercase`}>
              {currentPlan.displayName} Plan
            </h3>
            <p className={`text-sm ${colors.subtext} mt-1`}>
              {currentPlan.price === 0
                ? 'Free forever'
                : `€${currentPlan.price}/month • Billed monthly`}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-semibold rounded-full">
          Active
        </span>
      </div>

      <p className={`text-sm ${colors.subtext} mb-4`}>
        {currentPlan.description}
      </p>

      <div className="flex gap-3">
        <button
          onClick={onViewPlans}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          {currentTier === 'free' ? 'Upgrade Plan' : 'Switch Plan'}
        </button>
        <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium">
          Manage Subscription
        </button>
      </div>
    </div>
  )
}

// Usage Stats Component
function UsageStats() {
  const { currentPlan } = useSubscription()

  return (
    <div className="space-y-4">
      <UsageBar
        label="Artists"
        current={2}
        max={currentPlan.limits.artists === -1 ? 100 : currentPlan.limits.artists}
        isUnlimited={currentPlan.limits.artists === -1}
      />
      <UsageBar
        label="API Calls"
        current={12500}
        max={currentPlan.limits.apiCallsPerMonth === -1 ? 100000 : currentPlan.limits.apiCallsPerMonth}
        isUnlimited={currentPlan.limits.apiCallsPerMonth === -1}
      />
      <UsageBar
        label="Storage"
        current={250}
        max={currentPlan.limits.storageGB === -1 ? 1000 : currentPlan.limits.storageGB * 1000}
        unit="MB"
        isUnlimited={currentPlan.limits.storageGB === -1}
      />
      <UsageBar
        label="Team Members"
        current={1}
        max={currentPlan.limits.teamMembers === -1 ? 10 : currentPlan.limits.teamMembers}
        isUnlimited={currentPlan.limits.teamMembers === -1}
      />
    </div>
  )
}

// Plan Comparison Wrapper Component
function PlanComparisonWrapper() {
  return <PlanComparison showDevSwitch={true} />
}

function NotificationToggle({ label, description, defaultChecked }: { label: string; description?: string; defaultChecked: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
    </div>
  )
}

function PlatformCard({ name, status, description, tier }: { name: string; status: 'connected' | 'not_connected'; description: string; tier: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${tier === 'All tiers' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'}`}>
              {tier}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <div className="ml-4">
          {status === 'connected' ? (
            <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium">
              Disconnect
            </button>
          ) : (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              Connect
            </button>
          )}
        </div>
      </div>
      {status === 'connected' && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></span>
          Connected and syncing
        </div>
      )}
    </div>
  )
}

function UsageBar({ label, current, max, unit = '', isUnlimited = false }: { label: string; current: number; max: number; unit?: string; isUnlimited?: boolean }) {
  const percentage = (current / max) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isUnlimited ? (
            <>
              {current.toLocaleString()} {unit} <span className="text-green-600 dark:text-green-400 font-semibold">/ Unlimited</span>
            </>
          ) : (
            <>
              {current.toLocaleString()} / {max.toLocaleString()} {unit}
            </>
          )}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        {isUnlimited ? (
          <div className="h-2 rounded-full bg-green-500 w-full" />
        ) : (
          <div
            className={`h-2 rounded-full transition-all ${
              percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  )
}

function InvoiceRow({ date, amount, status }: { date: string; amount: string; status: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{date}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Invoice #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{amount}</span>
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-semibold rounded capitalize">
          {status}
        </span>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Download
        </button>
      </div>
    </div>
  )
}

function SessionRow({ device, location, current }: { device: string; location: string; current: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{device}</p>
          {current && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-semibold rounded">
              Current
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{location}</p>
      </div>
      {!current && (
        <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
          Revoke
        </button>
      )}
    </div>
  )
}

// Enhanced Platform Card Component
interface Platform {
  id: string
  name: string
  icon: string
  status: 'connected' | 'not_connected'
  description: string
  tier: string
  lastSync: Date | null
  dataPoints: string[]
  connectedEmail: string | null
}

function EnhancedPlatformCard({
  platform,
  onConnect,
  onDisconnect,
  onRefresh,
  isConnecting,
  isDisconnecting
}: {
  platform: Platform
  onConnect: () => void
  onDisconnect: () => void
  onRefresh: () => void
  isConnecting: boolean
  isDisconnecting: boolean
}) {
  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border-2 transition-all ${
      platform.status === 'connected'
        ? 'border-green-200 dark:border-green-800'
        : 'border-gray-200 dark:border-gray-800'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="text-4xl">{platform.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{platform.name}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  platform.tier === 'All tiers'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : platform.tier === 'PRO'
                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {platform.tier}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{platform.description}</p>

              {/* Data Points */}
              <div className="flex flex-wrap gap-2">
                {platform.dataPoints.map((point) => (
                  <span key={point} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded">
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {platform.status === 'connected' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></span>
              Connected
            </div>
          )}
        </div>

        {/* Connected Info */}
        {platform.status === 'connected' && platform.lastSync && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Connected as: <span className="font-medium text-gray-900 dark:text-white">{platform.connectedEmail}</span></p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Last synced: {getTimeSince(platform.lastSync)}</p>
              </div>
              <button
                onClick={onRefresh}
                className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
              >
                Refresh now
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {platform.status === 'connected' ? (
            <>
              <button
                onClick={onDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium">
                View Data
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Connect {platform.name}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Enhanced Session Row Component
interface Session {
  id: string
  device: string
  location: string
  ip: string
  lastActive: Date
  current: boolean
}

function EnhancedSessionRow({ session, onRevoke }: { session: Session; onRevoke: () => void }) {
  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Active now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{session.device}</p>
          {session.current && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-semibold rounded">
              Current Session
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{session.location}</span>
          <span>•</span>
          <span>{session.ip}</span>
          <span>•</span>
          <span>{getTimeSince(session.lastActive)}</span>
        </div>
      </div>
      {!session.current && (
        <button
          onClick={onRevoke}
          className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          Revoke
        </button>
      )}
    </div>
  )
}

// Security Check Item Component
function SecurityCheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
      ) : (
        <X className="w-5 h-5 text-gray-400" />
      )}
      <span className={`text-sm ${checked ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
        {label}
      </span>
    </div>
  )
}

// Password Change Modal Component
function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    alert('Password changed successfully!')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              At least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Two-Factor Setup Modal Component
function TwoFactorSetupModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState<'scan' | 'verify'>('scan')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (code.length !== 6) {
      alert('Please enter a 6-digit code')
      return
    }
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    alert('Two-factor authentication enabled successfully!')
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enable Two-Factor Authentication</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'scan' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>

            {/* QR Code Placeholder */}
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-gray-400">
                QR Code
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Or enter this code manually:</p>
              <code className="text-sm font-mono text-gray-900 dark:text-white">ABCD EFGH IJKL MNOP</code>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the 6-digit code from your authenticator app to verify
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('scan')}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={loading || code.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Enable 2FA'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
