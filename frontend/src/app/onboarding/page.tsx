'use client'

/**
 * Onboarding Wizard - New User Setup Flow
 *
 * 4-Step Onboarding Process:
 * 1. Welcome - Introduction to FanPulse
 * 2. Connect Spotify - Link Spotify account for music data
 * 3. Connect Instagram - Link Instagram for social analytics (optional)
 * 4. Add First Artist - Create first artist profile
 *
 * Features:
 * ✅ Multi-step wizard with progress indicator
 * ✅ Skip options for optional steps
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Smooth transitions
 * ✅ Form validation
 * ✅ Auto-redirect to dashboard on completion
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Music,
  Instagram,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  TrendingUp,
  BarChart3,
  Users,
  Zap,
  Globe,
  Target
} from 'lucide-react'

// ==================== TYPES ====================

type OnboardingStep = 'welcome' | 'spotify' | 'instagram' | 'artist' | 'success'

interface ArtistFormData {
  name: string
  genre: string
  spotifyUrl: string
  instagramHandle: string
}

// ==================== MAIN COMPONENT ====================

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [loading, setLoading] = useState(false)
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [instagramConnected, setInstagramConnected] = useState(false)
  const [artistData, setArtistData] = useState<ArtistFormData>({
    name: '',
    genre: '',
    spotifyUrl: '',
    instagramHandle: ''
  })

  // Step order
  const stepOrder: OnboardingStep[] = ['welcome', 'spotify', 'instagram', 'artist', 'success']
  const currentStepIndex = stepOrder.indexOf(currentStep)
  const totalSteps = 4 // Don't count success step

  // Navigation handlers
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex])
    }
  }

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(stepOrder[currentStepIndex - 1])
    }
  }

  const skipStep = () => {
    goToNextStep()
  }

  // Action handlers
  const handleConnectSpotify = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSpotifyConnected(true)
    setLoading(false)
    goToNextStep()
  }

  const handleConnectInstagram = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setInstagramConnected(true)
    setLoading(false)
    goToNextStep()
  }

  const handleCreateArtist = async () => {
    if (!artistData.name || !artistData.genre) {
      alert('Please fill in artist name and genre')
      return
    }

    setLoading(true)
    // Simulate API call to create artist
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    setCurrentStep('success')

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Progress Bar */}
          {currentStep !== 'success' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Complete
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
                  style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {currentStep === 'welcome' && (
              <WelcomeStep onNext={goToNextStep} />
            )}
            {currentStep === 'spotify' && (
              <SpotifyStep
                onConnect={handleConnectSpotify}
                onSkip={skipStep}
                onBack={goToPreviousStep}
                loading={loading}
                connected={spotifyConnected}
              />
            )}
            {currentStep === 'instagram' && (
              <InstagramStep
                onConnect={handleConnectInstagram}
                onSkip={skipStep}
                onBack={goToPreviousStep}
                loading={loading}
                connected={instagramConnected}
              />
            )}
            {currentStep === 'artist' && (
              <ArtistStep
                artistData={artistData}
                setArtistData={setArtistData}
                onCreate={handleCreateArtist}
                onBack={goToPreviousStep}
                loading={loading}
              />
            )}
            {currentStep === 'success' && (
              <SuccessStep />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== STEP 1: WELCOME ====================

interface WelcomeStepProps {
  onNext: () => void
}

function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="p-12 text-center">
      {/* Logo/Icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to FanPulse
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
        The AI-powered analytics platform that transforms data into music industry intelligence
      </p>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Track Momentum</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time momentum scoring and trend prediction
          </p>
        </div>

        <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Find Superfans</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Identify and connect with your most engaged fans
          </p>
        </div>

        <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
          <div className="w-12 h-12 rounded-lg bg-pink-500 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Insights</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get actionable recommendations powered by AI
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
      >
        Get Started
        <ArrowRight className="w-5 h-5" />
      </button>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
        Takes less than 2 minutes to set up
      </p>
    </div>
  )
}

// ==================== STEP 2: SPOTIFY ====================

interface SpotifyStepProps {
  onConnect: () => void
  onSkip: () => void
  onBack: () => void
  loading: boolean
  connected: boolean
}

function SpotifyStep({ onConnect, onSkip, onBack, loading, connected }: SpotifyStepProps) {
  return (
    <div className="p-12">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 mb-6">
        <Music className="w-8 h-8 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Connect Your Spotify
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Link your Spotify account to track streams, playlists, and listener insights in real-time
      </p>

      {/* Benefits */}
      <div className="space-y-4 mb-10">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Real-time streaming data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track daily streams, saves, and playlist adds</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Listener demographics</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Age, location, and listening habits of your audience</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Playlist performance</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monitor which playlists drive the most streams</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onConnect}
          disabled={loading || connected}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : connected ? (
            <>
              <Check className="w-5 h-5" />
              Connected
            </>
          ) : (
            <>
              <Music className="w-5 h-5" />
              Connect Spotify
            </>
          )}
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Skip for now
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
        You can connect Spotify later in Settings
      </p>
    </div>
  )
}

// ==================== STEP 3: INSTAGRAM ====================

interface InstagramStepProps {
  onConnect: () => void
  onSkip: () => void
  onBack: () => void
  loading: boolean
  connected: boolean
}

function InstagramStep({ onConnect, onSkip, onBack, loading, connected }: InstagramStepProps) {
  return (
    <div className="p-12">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
        <Instagram className="w-8 h-8 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Connect Instagram
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Link your Instagram to track engagement, follower growth, and discover the best times to post
      </p>

      {/* Benefits */}
      <div className="space-y-4 mb-10">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Engagement analytics</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track likes, comments, shares, and story views</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Best time to post</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered recommendations for maximum reach</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Follower insights</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Demographics, active hours, and growth trends</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onConnect}
          disabled={loading || connected}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : connected ? (
            <>
              <Check className="w-5 h-5" />
              Connected
            </>
          ) : (
            <>
              <Instagram className="w-5 h-5" />
              Connect Instagram
            </>
          )}
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Skip for now
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
        Optional - You can connect Instagram later in Settings
      </p>
    </div>
  )
}

// ==================== STEP 4: ARTIST ====================

interface ArtistStepProps {
  artistData: ArtistFormData
  setArtistData: (data: ArtistFormData) => void
  onCreate: () => void
  onBack: () => void
  loading: boolean
}

function ArtistStep({ artistData, setArtistData, onCreate, onBack, loading }: ArtistStepProps) {
  const genres = [
    'Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Indie', 'Country',
    'Jazz', 'Classical', 'Alternative', 'Metal', 'Folk', 'Reggae', 'Blues'
  ]

  return (
    <div className="p-12">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
        <Target className="w-8 h-8 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Add Your First Artist
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Create your artist profile to start tracking analytics and getting AI-powered insights
      </p>

      {/* Form */}
      <div className="space-y-6 mb-10">
        {/* Artist Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Artist Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={artistData.name}
            onChange={(e) => setArtistData({ ...artistData, name: e.target.value })}
            placeholder="e.g., Luna Park"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Primary Genre <span className="text-red-500">*</span>
          </label>
          <select
            value={artistData.genre}
            onChange={(e) => setArtistData({ ...artistData, genre: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select a genre</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Spotify URL (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Spotify Artist URL <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <input
            type="url"
            value={artistData.spotifyUrl}
            onChange={(e) => setArtistData({ ...artistData, spotifyUrl: e.target.value })}
            placeholder="https://open.spotify.com/artist/..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Instagram Handle (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Instagram Handle <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
            <input
              type="text"
              value={artistData.instagramHandle}
              onChange={(e) => setArtistData({ ...artistData, instagramHandle: e.target.value })}
              placeholder="username"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onCreate}
          disabled={loading || !artistData.name || !artistData.genre}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Artist Profile
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ==================== STEP 5: SUCCESS ====================

function SuccessStep() {
  return (
    <div className="p-12 text-center">
      {/* Success Animation */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-6 animate-bounce">
        <Check className="w-10 h-10 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        You're All Set! 🎉
      </h2>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Your FanPulse account is ready. Let's start discovering insights!
      </p>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Analytics Ready</h4>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
          <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">AI Activated</h4>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <Globe className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Platforms Connected</h4>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Redirecting to your dashboard...</span>
      </div>
    </div>
  )
}
