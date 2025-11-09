'use client'

import { Crown, Sparkles, TrendingUp, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import Button from './Button'

export default function UpgradeBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-700 dark:via-pink-700 dark:to-blue-700 animate-fade-in">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse-subtle" />
      </div>

      <div className="relative px-6 py-4">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          aria-label="Close banner"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-6 max-w-6xl mx-auto">
          {/* Icon */}
          <div className="hidden md:flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex-shrink-0">
            <Crown className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">Unlock AI-Powered Growth</h3>
              <span className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                LIMITED TIME
              </span>
            </div>
            <p className="text-sm text-white/90">
              Get AI-powered insights, churn prediction, smart alerts, and advanced analytics.
              <strong className="text-white"> Save 30% on annual plans</strong>
            </p>
          </div>

          {/* Features badges */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <div className="flex items-center gap-1.5 text-white">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI Tools</span>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <div className="flex items-center gap-1.5 text-white">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Scout Mode</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/dashboard/settings" className="flex-shrink-0">
            <Button
              variant="primary"
              className="bg-white hover:bg-gray-100 text-purple-600 shadow-lg hover:shadow-xl"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to PRO
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
