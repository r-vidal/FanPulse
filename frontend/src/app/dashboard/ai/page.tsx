'use client'

/**
 * AI Dashboard - Intelligence Artificielle Central Hub
 *
 * Regroupe toutes les fonctionnalités IA de FanPulse:
 * 1. Next Best Action Engine (Top 3 actions quotidiennes)
 * 2. Smart Alerts (ML-based alerting)
 * 3. AI Copilot (accessible via sidebar)
 *
 * REF: FanPulse IA Guide - Vision & Use Cases
 */

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NextBestActionEngine from '@/components/ai/NextBestActionEngine'
import SmartAlertsDashboard from '@/components/ai/SmartAlertsDashboard'
import AICopilotSidebar from '@/components/ai/AICopilotSidebar'
import { useArtistContext } from '@/contexts/ArtistContext'
import AnalyticsPageHeader from '@/components/ui/AnalyticsPageHeader'
import {
  Sparkles,
  Brain,
  Zap,
  Bell,
  MessageSquare,
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  Info,
} from 'lucide-react'

export default function AIDashboardPage() {
  const { selectedArtist, isAllArtists } = useArtistContext()
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'actions' | 'alerts'>('actions')

  const tabs = [
    {
      id: 'actions' as const,
      name: 'Next Best Actions',
      icon: Zap,
      description: 'Top 3 actions quotidiennes IA'
    },
    {
      id: 'alerts' as const,
      name: 'Smart Alerts',
      icon: Bell,
      description: 'Alertes intelligentes ML'
    }
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Page Header */}
          <AnalyticsPageHeader showMockDataNotice={false} />

          {/* AI Dashboard Header */}
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl p-8 text-white">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Brain className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    Intelligence Artificielle
                    <Sparkles className="w-8 h-8" />
                  </h1>
                  <p className="text-white/90 text-lg max-w-2xl">
                    Le cerveau décisionnel de FanPulse. L'IA analyse 24/7 pour transformer
                    tes données en actions concrètes avec ROI maximum.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCopilotOpen(true)}
                className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Ouvrir AI Copilot
              </button>
            </div>

            {/* AI Features Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-6 h-6" />
                  <h3 className="font-bold">Next Best Actions</h3>
                </div>
                <p className="text-sm text-white/80">
                  Top 3 actions quotidiennes avec ROI maximum
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Bell className="w-6 h-6" />
                  <h3 className="font-bold">Smart Alerts</h3>
                </div>
                <p className="text-sm text-white/80">
                  Baselines dynamiques + ML anomaly detection
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-6 h-6" />
                  <h3 className="font-bold">AI Copilot</h3>
                </div>
                <p className="text-sm text-white/80">
                  Queries en langage naturel (NLP)
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6" />
                  <h3 className="font-bold">Predictions</h3>
                </div>
                <p className="text-sm text-white/80">
                  Revenue forecasting, momentum, breakout score
                </p>
              </div>
            </div>
          </div>

          {/* AI Stats Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  +85% accuracy
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                100+
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Actions analysées quotidiennement
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  ML-powered
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                24/7
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitoring autonome actif
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  Real-time
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                50+
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Métriques analysées par IA
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-3 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${
                        isActive
                          ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">{tab.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'actions' && (
              <NextBestActionEngine artistId={selectedArtist?.id} />
            )}
            {activeTab === 'alerts' && (
              <SmartAlertsDashboard />
            )}
          </div>

          {/* AI Info Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Comment fonctionne l'IA FanPulse ?
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      🔮 PRÉDICTION
                    </h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Anticiper trajectoires artistes</li>
                      <li>• Forecaster revenus 3-12 mois</li>
                      <li>• Identifier breakouts avant explosion</li>
                      <li>• Optimiser timing releases</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                      💡 DÉCISION
                    </h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Générer top 3 actions quotidiennes</li>
                      <li>• Recommander allocations budget</li>
                      <li>• Suggérer meilleures dates sorties</li>
                      <li>• Prioriser prospects A&R</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      ⚙️ AUTOMATION
                    </h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Scout A&R autonome 24/7</li>
                      <li>• Monitoring continu (alertes)</li>
                      <li>• Génération insights proactifs</li>
                      <li>• Détection anomalies temps réel</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <strong>Algorithme:</strong> Score = (Impact × Urgence) / Effort •
                    <strong>Technologies:</strong> GPT-4, Random Forest, Prophet, Isolation Forest •
                    <strong>Accuracy:</strong> 85%+ validated
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Copilot Sidebar */}
        <AICopilotSidebar isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
