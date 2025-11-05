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
import {
  User,
  Bell,
  Link as LinkIcon,
  CreditCard,
  Shield,
  Settings as SettingsIcon
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
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connected Platforms</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your connected streaming and social media accounts
        </p>
      </div>

      {/* Connected Platforms */}
      <div className="space-y-4">
        <PlatformCard
          name="Spotify for Artists"
          status="connected"
          description="Streams, listeners, playlist data"
          tier="All tiers"
        />
        <PlatformCard
          name="Instagram Business"
          status="connected"
          description="Posts, engagement, audience insights"
          tier="All tiers"
        />
        <PlatformCard
          name="TikTok Creator"
          status="not_connected"
          description="Video analytics, sound tracking"
          tier="PRO"
        />
        <PlatformCard
          name="YouTube"
          status="not_connected"
          description="Video performance, subscribers"
          tier="PRO"
        />
        <PlatformCard
          name="Apple Music for Artists"
          status="not_connected"
          description="Streams, Shazam, radio plays"
          tier="PRO"
        />
      </div>
    </div>
  )
}

// Billing Section Component
function BillingSection() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Billing & Subscription</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 uppercase">
              {user?.subscription_tier || 'SOLO'} Plan
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              €199/month • Billed monthly
            </p>
          </div>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-semibold rounded-full">
            Active
          </span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Upgrade Plan
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium">
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Usage This Month</h3>
        <div className="space-y-4">
          <UsageBar label="Artists" current={2} max={3} />
          <UsageBar label="API Calls" current={12500} max={50000} />
          <UsageBar label="Storage" current={250} max={1000} unit="MB" />
        </div>
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
    </div>
  )
}

// Security Section Component
function SecuritySection() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Security Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your account security and login sessions
        </p>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Password</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Last changed 30 days ago
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          Change Password
        </button>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-semibold rounded-full">
            Disabled
          </span>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
          Enable 2FA
        </button>
      </div>

      {/* Active Sessions */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
        <div className="space-y-3">
          <SessionRow
            device="Chrome on macOS"
            location="Paris, France"
            current={true}
          />
          <SessionRow
            device="Safari on iPhone"
            location="Paris, France"
            current={false}
          />
        </div>
      </div>
    </div>
  )
}

// Helper Components
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

function UsageBar({ label, current, max, unit = '' }: { label: string; current: number; max: number; unit?: string }) {
  const percentage = (current / max) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {current.toLocaleString()} / {max.toLocaleString()} {unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
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
