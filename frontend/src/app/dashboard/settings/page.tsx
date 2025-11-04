'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Alert from '@/components/ui/Alert'
import { authApi, User } from '@/lib/api/auth'
import { User as UserIcon, Mail, Shield, Bell, Key, Palette } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const data = await authApi.me()
      setUser(data)
    } catch (err: any) {
      console.error('Failed to fetch user:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your account settings and preferences
            </p>
          </div>

          {message && (
            <Alert type={message.type} title={message.type === 'success' ? 'Success' : 'Error'}>
              {message.text}
            </Alert>
          )}

          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Profile Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user?.email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 capitalize">{user?.tier || 'Free'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Bell className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">
                        Receive email alerts for important events
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Momentum Alerts</p>
                      <p className="text-sm text-gray-600">
                        Get notified when artist momentum changes significantly
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Reports</p>
                      <p className="text-sm text-gray-600">
                        Receive weekly performance summaries
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* API Keys Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Key className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">API Keys</h2>
                </div>

                <p className="text-gray-600 mb-4">
                  Manage your platform API keys and integrations
                </p>

                <a
                  href="/dashboard/api-keys"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Manage API Keys
                </a>
              </div>

              {/* Appearance Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Palette className="w-5 h-5 text-pink-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="p-4 border-2 border-blue-600 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                      <div className="w-full h-12 bg-white rounded mb-2 shadow-sm"></div>
                      <p className="text-sm font-medium text-gray-900">Light</p>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="w-full h-12 bg-gray-800 rounded mb-2 shadow-sm"></div>
                      <p className="text-sm font-medium text-gray-900">Dark</p>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="w-full h-12 bg-gradient-to-r from-white to-gray-800 rounded mb-2 shadow-sm"></div>
                      <p className="text-sm font-medium text-gray-900">Auto</p>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
