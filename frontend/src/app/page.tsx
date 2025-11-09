'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  TrendingUp, Users, DollarSign, Calendar, Zap, Heart,
  BarChart3, Target, CheckCircle, Star, ArrowRight,
  Play, ChevronDown, Music, Sparkles, Shield, Clock
} from 'lucide-react'

export default function Home() {
  const [activePricing, setActivePricing] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Music className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">FanPulse</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</a>
              <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white pt-32 pb-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">New: AI-Powered Actions Engine</span>
              <span className="px-2 py-0.5 bg-green-500 rounded-full text-xs font-bold">LIVE</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Transform Data Into
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
                Artist Growth
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              The All-in-One Intelligence Platform for Music Managers & Labels
            </p>

            <p className="text-lg text-blue-200 mb-10 max-w-2xl mx-auto">
              Replace 7+ tools with one platform. Analytics + Predictions + Actions + Publishing. Save 50-70% vs competitors.
            </p>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-10 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div>
                <div className="text-3xl font-bold">69</div>
                <div className="text-sm text-blue-200">Features</div>
              </div>
              <div>
                <div className="text-3xl font-bold">23</div>
                <div className="text-sm text-blue-200">Unique to FanPulse</div>
              </div>
              <div>
                <div className="text-3xl font-bold">4</div>
                <div className="text-sm text-blue-200">Pricing Tiers</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            <p className="mt-6 text-blue-200 text-sm">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="dark:hidden">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden dark:block">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#111827"/>
          </svg>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 font-medium">Trusted by music professionals worldwide</p>
          <div className="flex items-center justify-center gap-12 opacity-50 grayscale">
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">Spotify</div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">Apple Music</div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">YouTube</div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">Instagram</div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">TikTok</div>
          </div>
        </div>
      </section>

      {/* Core Features - Enhanced */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
              CORE ANALYTICS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Replace ChartMetric ($1,400/mo), Buffer ($99/mo), Linktree ($5/mo), Mailchimp ($50/mo) with one platform at $999/mo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 - Momentum */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-8 rounded-2xl border border-blue-200 dark:border-blue-800/50 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-600 dark:bg-blue-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Momentum Index</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Real-time 0-10 score tracking artist growth velocity across 5 signals: streams, engagement, followers, playlists, virality.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <span>Fire / Growing / Stable / Declining status</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <span>90-day historical tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <span>Inflection point detection</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 - Superfans */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 p-8 rounded-2xl border border-purple-200 dark:border-purple-800/50 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-purple-600 dark:bg-purple-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Superfan Analysis</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Identify Top 20 (SOLO) or Top 100 (PRO+) fans with Fan Value Score (FVS 0-100) breakdown.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <span>Listening 40% + Engagement 35% + Monetization 25%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <span>Location & preference tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <span>Personalized DM templates</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 - Actions */}
            <div className="group bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/30 p-8 rounded-2xl border border-pink-200 dark:border-pink-800/50 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-pink-600 dark:bg-pink-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Next Best Actions</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                AI engine analyzes 20+ rules to recommend 1 priority action per artist daily with urgency + impact.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-600 dark:text-pink-400 mt-0.5" />
                  <span>Critical / High / Medium / Low urgency</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-600 dark:text-pink-400 mt-0.5" />
                  <span>Reasoning + expected impact</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-600 dark:text-pink-400 mt-0.5" />
                  <span>48h impact measurement</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Additional Features Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: DollarSign, title: 'Revenue Forecasting', desc: '3-12 month predictions with 3 scenarios' },
              { icon: Calendar, title: 'Release Optimizer', desc: 'Find best Friday for drops (0-10 score)' },
              { icon: BarChart3, title: 'Opportunity Alerts', desc: '7 real-time alerts (viral spike, momentum drop)' },
              { icon: Target, title: 'Scout Mode', desc: 'Auto-scan 10k artists/day + AI detection' }
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Start free, scale as you grow. All plans include 14-day free trial.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActivePricing('monthly')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activePricing === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setActivePricing('yearly')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activePricing === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Yearly
                <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* SOLO */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">SOLO</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${activePricing === 'monthly' ? '199' : '159'}
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Perfect for independent artists</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Core Analytics (Momentum, Superfans Top 20, Actions)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Platform Integrations (Spotify, Instagram)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Weekly Reports</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* PRO */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-blue-500 dark:border-blue-600 p-8 relative transform scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PRO</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${activePricing === 'monthly' ? '399' : '319'}
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">For professional managers</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Everything in SOLO</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>AI Predictions (Revenue, Release Optimizer)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Opportunity Alerts</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Email/SMS Campaigns</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Superfans Top 100</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* LABEL */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:border-purple-300 dark:hover:border-purple-600 transition-all">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">LABEL</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${activePricing === 'monthly' ? '999' : '799'}
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">For indie labels</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Everything in PRO</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Scout Mode (10k artists/day scan)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Portfolio Health Score</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Royalty Tracking + P&L</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>10 Team Seats</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* ENTERPRISE */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 rounded-2xl border-2 border-gray-700 dark:border-gray-600 p-8 text-white hover:border-yellow-500 dark:hover:border-yellow-600 transition-all">
              <h3 className="text-2xl font-bold mb-2">ENTERPRISE</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <p className="text-gray-300 dark:text-gray-400 mb-6">For major labels</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-200 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Everything in LABEL</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-200 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span>White-glove onboarding</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-200 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span>Custom integrations (SAP, Salesforce)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-200 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span>Dedicated account manager 24/7</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-200 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span>Unlimited seats</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="block w-full text-center bg-yellow-500 dark:bg-yellow-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 dark:hover:bg-yellow-500 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-600 dark:text-gray-400 mt-8">
            All plans include 14-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Bank-Level Security</h3>
              <p className="text-gray-600 dark:text-gray-400">256-bit SSL encryption. SOC 2 Type II compliant. GDPR ready.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">99.9% Uptime SLA</h3>
              <p className="text-gray-600 dark:text-gray-400">Reliable infrastructure. Daily automated backups. 24/7 monitoring.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Premium Support</h3>
              <p className="text-gray-600 dark:text-gray-400">Email support (24h response). PRO+ gets priority + live chat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How does the 14-day free trial work?',
                a: 'Start with any paid plan for free. No credit card required. Full access to all features. Cancel anytime before day 14 with zero charges.'
              },
              {
                q: 'Can I switch plans later?',
                a: 'Yes! Upgrade or downgrade anytime. Changes take effect immediately. Pro-rated billing applies.'
              },
              {
                q: 'Which platforms do you integrate with?',
                a: 'Spotify, Apple Music, Instagram, YouTube, TikTok, Twitter/X. More coming: Deezer, Amazon Music, Bandsintown.'
              },
              {
                q: 'Is my data secure?',
                a: 'Absolutely. We use bank-level 256-bit SSL encryption. Your data is never sold to third parties. SOC 2 Type II compliant.'
              },
              {
                q: 'Do I need Spotify for Artists access?',
                a: 'No! We use public Spotify API for basic metrics. For advanced features (detailed demographics), Spotify for Artists helps but isn\'t required.'
              }
            ].map((faq, i) => (
              <details key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 group">
                <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer flex items-center justify-between">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Amplify Your Artists?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join music managers using data to drive growth. Replace 7+ tools with one platform. Save 50-70% vs competitors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group bg-white text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 px-10 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              Talk to Sales
            </Link>
          </div>
          <p className="mt-6 text-blue-200 text-sm flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              No credit card required
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Cancel anytime
            </span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-6 h-6 text-blue-500" />
                <span className="text-white text-lg font-bold">FanPulse</span>
              </div>
              <p className="text-gray-400 text-sm">
                The All-in-One Intelligence Platform for Music Managers & Labels. Transform data into artist growth.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Start Trial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">&copy; 2025 FanPulse. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
