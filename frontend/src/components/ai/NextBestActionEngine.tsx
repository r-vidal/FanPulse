'use client'

/**
 * Next Best Action Engine - Killer Feature IA
 *
 * Analyse 100+ actions possibles et génère Top 3 actions quotidiennes
 * avec ROI maximum basé sur:
 * - Momentum actuel
 * - Engagement social
 * - Timing optimal
 * - Urgence (fenêtres opportunité)
 * - Effort requis
 * - Impact estimé
 *
 * Algorithm: Action Score = (Impact × Urgence) / Effort
 *
 * REF: FanPulse IA Guide - Use Case #1
 */

import { useState, useEffect } from 'react'
import {
  Zap,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Users,
  Instagram,
  Music,
  Calendar,
  Mail,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

export type ActionUrgency = 'critical' | 'high' | 'medium' | 'low'
export type ActionCategory = 'social' | 'fan_engagement' | 'playlists' | 'release' | 'collaboration' | 'marketing'

export interface NextAction {
  id: string
  title: string
  description: string
  category: ActionCategory
  urgency: ActionUrgency
  effortMinutes: number // Temps requis en minutes
  impact: {
    metric: string // Ex: "Streams", "Engagement", "Followers"
    estimated: string // Ex: "+200 likes", "+500 streams"
  }
  reasoning: string[]
  deadline?: string // ISO date or relative "2h", "today 20h"
  score: number // 0-100 (Impact × Urgency / Effort)
  confidence: number // 0-100% (confiance prédiction)
  actions: {
    primary: string
    secondary?: string
  }
}

interface NextBestActionEngineProps {
  artistId?: string
}

export default function NextBestActionEngine({ artistId }: NextBestActionEngineProps) {
  const [actions, setActions] = useState<NextAction[]>([])
  const [loading, setLoading] = useState(true)
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
  const [snoozedActions, setSnoozedActions] = useState<Set<string>>(new Set())

  useEffect(() => {
    generateActions()
  }, [artistId])

  const generateActions = () => {
    setLoading(true)

    // TODO: Replace with real AI endpoint
    // Algorithm: Analyze 100+ possible actions, score them, return top 3
    const mockActions: NextAction[] = [
      {
        id: '1',
        title: 'Poste sur Instagram maintenant',
        description: "Ton audience est 3x plus active dans les 2 prochaines heures (18h-20h)",
        category: 'social',
        urgency: 'critical',
        effortMinutes: 15,
        impact: {
          metric: 'Engagement',
          estimated: '+200 likes, +30 comments'
        },
        reasoning: [
          "Peak activity window detected (18h-20h)",
          "Audience timezone analysis shows 73% online now",
          "Last 3 posts at this time performed 2.3x better",
          "Competing posts low (optimal visibility)"
        ],
        deadline: 'Aujourd\'hui 20h00',
        score: 94,
        confidence: 89,
        actions: {
          primary: 'Post Now',
          secondary: 'Schedule for 18h30'
        }
      },
      {
        id: '2',
        title: 'Réponds à ce superfan VIP',
        description: '@julie_music t\'a tagué 5 fois cette semaine (FVS: 94/100)',
        category: 'fan_engagement',
        urgency: 'high',
        effortMinutes: 5,
        impact: {
          metric: 'Fan Loyalty',
          estimated: 'Strengthen VIP relationship, potential UGC'
        },
        reasoning: [
          "Platinum superfan (FVS 94/100 - Top 1%)",
          "5 tags this week (highest engagement)",
          "€180 spent on merch last month",
          "Highly likely to create UGC if acknowledged"
        ],
        score: 88,
        confidence: 92,
        actions: {
          primary: 'Send DM',
          secondary: 'View Profile'
        }
      },
      {
        id: '3',
        title: 'Pitch Discover Weekly cette semaine',
        description: 'Ton momentum est optimal (score 87/100) pour pitching',
        category: 'playlists',
        urgency: 'medium',
        effortMinutes: 30,
        impact: {
          metric: 'Streams',
          estimated: '+1,500 streams/week si accepté (probabilité 35%)'
        },
        reasoning: [
          "Momentum index: 87/100 (above playlist threshold 75)",
          "Spotify editorial cycle: deadline Friday",
          "Your genre acceptance rate: 35% (above average)",
          "Recent saves rate: 3.2% (strong quality signal)"
        ],
        deadline: 'Vendredi 16h00',
        score: 82,
        confidence: 78,
        actions: {
          primary: 'Start Pitch',
          secondary: 'Learn More'
        }
      }
    ]

    setTimeout(() => {
      setActions(mockActions)
      setLoading(false)
    }, 800)
  }

  const handleMarkComplete = (actionId: string) => {
    setCompletedActions(prev => new Set(prev).add(actionId))
    // TODO: Send to backend for tracking
  }

  const handleSnooze = (actionId: string) => {
    setSnoozedActions(prev => new Set(prev).add(actionId))
    // TODO: Reschedule action for later
  }

  const handleDismiss = (actionId: string) => {
    setActions(prev => prev.filter(a => a.id !== actionId))
    // TODO: Send feedback to AI (user dismissed this action)
  }

  const getUrgencyColor = (urgency: ActionUrgency) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
    }
  }

  const getUrgencyIcon = (urgency: ActionUrgency) => {
    switch (urgency) {
      case 'critical':
        return <AlertCircle className="w-5 h-5" />
      case 'high':
        return <Zap className="w-5 h-5" />
      case 'medium':
        return <Target className="w-5 h-5" />
      case 'low':
        return <Clock className="w-5 h-5" />
    }
  }

  const getCategoryIcon = (category: ActionCategory) => {
    switch (category) {
      case 'social':
        return <Instagram className="w-5 h-5" />
      case 'fan_engagement':
        return <Users className="w-5 h-5" />
      case 'playlists':
        return <Music className="w-5 h-5" />
      case 'release':
        return <Calendar className="w-5 h-5" />
      case 'collaboration':
        return <Users className="w-5 h-5" />
      case 'marketing':
        return <Mail className="w-5 h-5" />
    }
  }

  const visibleActions = actions.filter(a => !completedActions.has(a.id) && !snoozedActions.has(a.id))

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="space-y-3">
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Next Best Actions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              IA a analysé 100+ actions possibles - Voici ton Top 3
            </p>
          </div>
        </div>
        <button
          onClick={generateActions}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {completedActions.size}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Actions complétées
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {visibleActions.length}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Actions en attente
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {actions.length > 0 ? Math.round(actions.reduce((sum, a) => sum + a.score, 0) / actions.length) : 0}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Score moyen ROI
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {visibleActions.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Toutes les actions complétées !
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              L'IA génèrera de nouvelles actions demain matin
            </p>
            <button
              onClick={generateActions}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Générer maintenant
            </button>
          </div>
        ) : (
          visibleActions.map((action, index) => (
            <div
              key={action.id}
              className={`
                bg-white dark:bg-gray-900 rounded-xl border-2 transition-all hover:shadow-lg
                ${getUrgencyColor(action.urgency)}
              `}
            >
              {/* Action Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-xl ${action.urgency === 'critical' ? 'bg-red-600' : action.urgency === 'high' ? 'bg-orange-600' : action.urgency === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'}`}>
                      {getCategoryIcon(action.category)}
                      <span className="text-white"></span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded">
                          #{index + 1}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${getUrgencyColor(action.urgency)}`}>
                          {getUrgencyIcon(action.urgency)}
                          {action.urgency}
                        </span>
                        {action.deadline && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded flex items-center gap-1">
                            <Clock3 className="w-3 h-3" />
                            {action.deadline}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {action.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {action.description}
                      </p>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Effort</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {action.effortMinutes < 60 ? `${action.effortMinutes} min` : `${Math.round(action.effortMinutes / 60)}h`}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Impact Estimé</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {action.impact.estimated}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score ROI</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {action.score}/100
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismiss(action.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Reasoning */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                    💡 Pourquoi cette action ?
                  </p>
                  <ul className="space-y-1">
                    {action.reasoning.map((reason, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Confiance IA: {action.confidence}%
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                <button
                  onClick={() => handleMarkComplete(action.id)}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {action.actions.primary}
                </button>
                {action.actions.secondary && (
                  <button
                    className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-colors"
                  >
                    {action.actions.secondary}
                  </button>
                )}
                <button
                  onClick={() => handleSnooze(action.id)}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold flex items-center gap-2 transition-colors"
                >
                  <Clock3 className="w-5 h-5" />
                  Snooze 1h
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Comment ça marche ?
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              L'IA analyse 100+ actions possibles chaque jour et calcule un score ROI pour chacune :
              <strong> Score = (Impact × Urgence) / Effort</strong>.
              Les 3 meilleures actions sont présentées ici avec leur raisonnement détaillé.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
