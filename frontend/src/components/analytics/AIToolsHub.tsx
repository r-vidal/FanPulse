'use client'

import { useState } from 'react'
import {
  mockChurnPredictions, mockCaptionGeneration, mockCollabMatches,
  ChurnPrediction, GeneratedCaption, CollabMatch, SocialPlatform
} from '@/lib/mockData'
import {
  Sparkles, AlertTriangle, TrendingDown, Users, Hash, Copy, CheckCircle2,
  Instagram, Twitter, Youtube, Facebook, Zap, Target, TrendingUp
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

type TabType = 'churn' | 'captions' | 'collab'

/**
 * AI Tools Hub
 * Unified interface for all AI-powered features
 * - Churn Prediction: GET /api/ai/churn-prediction
 * - Caption Generator: POST /api/ai/generate-caption
 * - Collaboration Finder: GET /api/ai/collab-matches
 */
export default function AIToolsHub({ artistId }: { artistId?: string }) {
  const [activeTab, setActiveTab] = useState<TabType>('churn')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Tools Hub</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Powered by machine learning and predictive analytics
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('churn')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'churn'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Churn Prediction
        </button>
        <button
          onClick={() => setActiveTab('captions')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'captions'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4" />
          Caption Generator
        </button>
        <button
          onClick={() => setActiveTab('collab')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'collab'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Collaboration Finder
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'churn' && <ChurnPredictionTab artistId={artistId} />}
      {activeTab === 'captions' && <CaptionGeneratorTab artistId={artistId} />}
      {activeTab === 'collab' && <CollaborationFinderTab artistId={artistId} />}
    </div>
  )
}

/* ============================================================================
 * CHURN PREDICTION TAB
 * ============================================================================ */
function ChurnPredictionTab({ artistId }: { artistId?: string }) {
  const [data] = useState<ChurnPrediction[]>(mockChurnPredictions(20))
  const [selectedFan, setSelectedFan] = useState<ChurnPrediction | null>(null)

  // Sort by churn risk (highest first)
  const sortedData = [...data].sort((a, b) => b.churnRisk - a.churnRisk)
  const highRisk = data.filter(f => f.churnRisk >= 60).length
  const avgConfidence = Math.round(data.reduce((sum, f) => sum + f.confidence, 0) / data.length)

  const getChurnColor = (risk: number) => {
    if (risk >= 70) return 'text-red-600 dark:text-red-400'
    if (risk >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getChurnBg = (risk: number) => {
    if (risk >= 70) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    if (risk >= 40) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Risk Fans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{highRisk}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Analyzed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgConfidence}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Churn List */}
      <div className="space-y-3">
        {sortedData.map((fan) => (
          <div
            key={fan.fanId}
            onClick={() => setSelectedFan(fan)}
            className={`rounded-xl border p-5 cursor-pointer hover:shadow-md transition-all ${getChurnBg(fan.churnRisk)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{fan.fanName}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    fan.churnRisk >= 70 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                    fan.churnRisk >= 40 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                  }`}>
                    {fan.churnRisk}% Risk
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Current FVS</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{fan.currentFVS}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Predicted FVS</p>
                    <p className={`font-semibold ${getChurnColor(fan.churnRisk)}`}>
                      {fan.predictedFVS} <TrendingDown className="w-3 h-3 inline" />
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Churn Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(fan.churnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fan Detail Modal */}
      {selectedFan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedFan(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedFan.fanName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Churn Prediction Analysis</p>
                </div>
                <button
                  onClick={() => setSelectedFan(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Risk Score */}
              <div className={`p-6 rounded-xl border ${getChurnBg(selectedFan.churnRisk)}`}>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Churn Risk Score</p>
                  <p className={`text-6xl font-bold ${getChurnColor(selectedFan.churnRisk)}`}>
                    {selectedFan.churnRisk}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Confidence: {selectedFan.confidence}%
                  </p>
                </div>
              </div>

              {/* FVS Trend */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">FVS Historical Pattern</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedFan.historicalPattern}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6',
                          fontSize: '12px'
                        }}
                      />
                      <Line type="monotone" dataKey="fvs" stroke="#3B82F6" strokeWidth={2} name="FVS Score" />
                      <Line type="monotone" dataKey="churnRisk" stroke="#EF4444" strokeWidth={2} name="Churn Risk %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Risk Factors</h4>
                <div className="space-y-2">
                  {selectedFan.factors.map((factor, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{factor.factor}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {factor.impact.toFixed(1)}% impact
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          factor.trend === 'increasing' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                          factor.trend === 'decreasing' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {factor.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recommended Actions</h4>
                <ul className="space-y-2">
                  {selectedFan.recommendedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock predictions.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/ai/churn-prediction
          </code> for real-time ML predictions.
        </p>
      </div>
    </div>
  )
}

/* ============================================================================
 * CAPTION GENERATOR TAB
 * ============================================================================ */
function CaptionGeneratorTab({ artistId }: { artistId?: string }) {
  const [context, setContext] = useState('')
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [tone, setTone] = useState('casual')
  const [generated, setGenerated] = useState<GeneratedCaption[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const platformIcons = {
    instagram: Instagram,
    tiktok: Music,
    twitter: Twitter,
    youtube: Youtube,
    facebook: Facebook,
  }

  const handleGenerate = () => {
    const captions = mockCaptionGeneration(context, platform, tone)
    setGenerated(captions)
  }

  const handleCopy = (caption: string, id: string) => {
    navigator.clipboard.writeText(caption)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate AI Captions</h3>

        <div className="space-y-4">
          {/* Context Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              What's your post about?
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., Announcing my new single dropping Friday..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
              rows={3}
            />
          </div>

          {/* Platform Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Platform
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['instagram', 'tiktok', 'twitter', 'youtube', 'facebook'] as SocialPlatform[]).map((p) => {
                const Icon = platformIcons[p]
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                      platform === p
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs capitalize">{p}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
              <option value="playful">Playful</option>
              <option value="inspirational">Inspirational</option>
              <option value="promotional">Promotional</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!context}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            Generate Captions with AI
          </button>
        </div>
      </div>

      {/* Generated Captions */}
      {generated.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Captions</h3>
          {generated.map((caption) => (
            <div
              key={caption.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              {/* Caption Text */}
              <div className="mb-4">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{caption.caption}</p>
              </div>

              {/* Hashtags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {caption.hashtags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Metrics */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Est. Engagement: </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{caption.estimatedEngagement}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Viral Score: </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{caption.viralScore}/100</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(`${caption.caption}\n\n${caption.hashtags.join(' ')}`, caption.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {copiedId === caption.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock captions.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            POST /api/ai/generate-caption
          </code> for real-time AI generation.
        </p>
      </div>
    </div>
  )
}

/* ============================================================================
 * COLLABORATION FINDER TAB
 * ============================================================================ */
function CollaborationFinderTab({ artistId }: { artistId?: string }) {
  const [data] = useState<CollabMatch[]>(mockCollabMatches(15))
  const [selectedMatch, setSelectedMatch] = useState<CollabMatch | null>(null)

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 75) return 'text-blue-600 dark:text-blue-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Potential Matches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Match (90+)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.filter(d => d.matchScore >= 90).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg ROI</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                +{Math.round(data.reduce((sum, d) => sum + d.estimatedROI, 0) / data.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Cards */}
      <div className="grid grid-cols-1 gap-4">
        {data.map((match, i) => (
          <div
            key={match.artistId}
            onClick={() => setSelectedMatch(match)}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {match.artistName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{match.artistName}</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {match.genre.map((g, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getMatchColor(match.matchScore)}`}>
                  {match.matchScore}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Match Score</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Followers</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(match.followers)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Listeners</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(match.monthlyListeners)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Shared</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{match.sharedAudience}%</p>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Est. ROI</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">+{match.estimatedROI}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  match.availability === 'available' ? 'bg-green-500' :
                  match.availability === 'interested' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`} />
                <span className="text-gray-600 dark:text-gray-400 capitalize">{match.availability}</span>
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMatch(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedMatch.artistName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedMatch.artistName}</h3>
                    <div className="flex gap-2 mt-1">
                      {selectedMatch.genre.map((g, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-sm">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Match Score */}
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Overall Match Score</p>
                <p className={`text-7xl font-bold ${getMatchColor(selectedMatch.matchScore)}`}>
                  {selectedMatch.matchScore}
                </p>
              </div>

              {/* Compatibility Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Compatibility Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(selectedMatch.compatibility).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{key}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-blue-500"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white w-10 text-right">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Shared Audience</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{selectedMatch.sharedAudience}%</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Projected Reach</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{formatNumber(selectedMatch.projectedReach)}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Est. ROI</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">+{selectedMatch.estimatedROI}%</p>
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Why This Match?</h4>
                <ul className="space-y-2">
                  {selectedMatch.reasoning.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Previous Collabs */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Previous Collaborations</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMatch.previousCollabs.map((artist, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock matches.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/ai/collab-matches
          </code> for real-time AI matching.
        </p>
      </div>
    </div>
  )
}

// Music icon for TikTok
function Music({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}
