'use client'

/**
 * SubscriptionContext - Global subscription plan management
 *
 * Features:
 * - Manage current subscription tier (FREE, PRO, ENTERPRISE)
 * - Switch between plans (for dev testing and user upgrades)
 * - Persist plan selection to localStorage
 * - Provide plan features and limits
 * - Check feature availability based on tier
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface PlanFeatures {
  name: string
  displayName: string
  price: number // per month in EUR
  priceAnnual: number // annual price (discounted)
  description: string
  features: string[]
  limits: {
    artists: number // -1 = unlimited
    apiCallsPerMonth: number // -1 = unlimited
    storageGB: number // -1 = unlimited
    teamMembers: number // -1 = unlimited
  }
  advanced: {
    whiteLabel: boolean
    apiAccess: boolean
    prioritySupport: boolean
    customIntegrations: boolean
    aiTools: boolean
    scoutMode: boolean
    tourPlanning: boolean
    socialROI: boolean
    revenueForecasting: boolean
    releaseOptimizer: boolean
  }
}

// Plan definitions
export const PLANS: Record<SubscriptionTier, PlanFeatures> = {
  free: {
    name: 'free',
    displayName: 'FREE',
    price: 0,
    priceAnnual: 0,
    description: 'Perfect for emerging artists and testing the platform',
    features: [
      'Up to 1 artist profile',
      'Basic analytics dashboard',
      'Momentum tracking',
      'Fan demographics',
      'Weekly email reports',
      'Spotify & Instagram integration',
      '5,000 API calls/month',
    ],
    limits: {
      artists: 1,
      apiCallsPerMonth: 5000,
      storageGB: 0.5,
      teamMembers: 1,
    },
    advanced: {
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false,
      customIntegrations: false,
      aiTools: false,
      scoutMode: false,
      tourPlanning: false,
      socialROI: false,
      revenueForecasting: false,
      releaseOptimizer: false,
    },
  },
  pro: {
    name: 'pro',
    displayName: 'PRO',
    price: 199,
    priceAnnual: 1990, // ~17% discount (10 months price)
    description: 'For professional artists, managers & small labels',
    features: [
      'Up to 5 artists',
      'All FREE features',
      'Advanced analytics suite',
      'AI-powered insights',
      'Scout Mode A&R',
      'Tour Planning Intelligence',
      'Social Media ROI tracking',
      'Revenue Forecasting',
      'Release Optimizer',
      'Superfan identification',
      'All platform integrations',
      '50,000 API calls/month',
      'Priority email support',
      'Custom reports',
    ],
    limits: {
      artists: 5,
      apiCallsPerMonth: 50000,
      storageGB: 5,
      teamMembers: 3,
    },
    advanced: {
      whiteLabel: false,
      apiAccess: true,
      prioritySupport: true,
      customIntegrations: false,
      aiTools: true,
      scoutMode: true,
      tourPlanning: true,
      socialROI: true,
      revenueForecasting: true,
      releaseOptimizer: true,
    },
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'ENTERPRISE',
    price: 999,
    priceAnnual: 9990, // custom pricing, shown as starting price
    description: 'For labels, agencies & large organizations',
    features: [
      'Unlimited artists',
      'All PRO features',
      'White-label reports',
      'Full API access',
      'Custom integrations',
      'Dedicated account manager',
      'Priority 24/7 support',
      'Unlimited API calls',
      'Unlimited storage',
      'Unlimited team members',
      'Custom feature development',
      'SLA guarantees',
      'Advanced security (SSO)',
      'Custom data exports',
    ],
    limits: {
      artists: -1, // unlimited
      apiCallsPerMonth: -1, // unlimited
      storageGB: -1, // unlimited
      teamMembers: -1, // unlimited
    },
    advanced: {
      whiteLabel: true,
      apiAccess: true,
      prioritySupport: true,
      customIntegrations: true,
      aiTools: true,
      scoutMode: true,
      tourPlanning: true,
      socialROI: true,
      revenueForecasting: true,
      releaseOptimizer: true,
    },
  },
}

interface SubscriptionContextType {
  currentTier: SubscriptionTier
  currentPlan: PlanFeatures
  setTier: (tier: SubscriptionTier) => void
  hasFeature: (feature: keyof PlanFeatures['advanced']) => boolean
  canAddArtist: (currentCount: number) => boolean
  getRemainingArtists: (currentCount: number) => number | null // null = unlimited
  getAllPlans: () => PlanFeatures[]
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free')

  // Load tier from localStorage on mount
  useEffect(() => {
    const savedTier = localStorage.getItem('subscription_tier')
    if (savedTier && (savedTier === 'free' || savedTier === 'pro' || savedTier === 'enterprise')) {
      setCurrentTier(savedTier as SubscriptionTier)
    }
  }, [])

  // Save tier to localStorage when it changes
  const handleSetTier = (tier: SubscriptionTier) => {
    setCurrentTier(tier)
    localStorage.setItem('subscription_tier', tier)
    console.log(`✅ Subscription changed to: ${tier.toUpperCase()}`)
  }

  // Check if current plan has a specific feature
  const hasFeature = (feature: keyof PlanFeatures['advanced']): boolean => {
    return PLANS[currentTier].advanced[feature]
  }

  // Check if user can add more artists
  const canAddArtist = (currentCount: number): boolean => {
    const limit = PLANS[currentTier].limits.artists
    if (limit === -1) return true // unlimited
    return currentCount < limit
  }

  // Get remaining artists slots
  const getRemainingArtists = (currentCount: number): number | null => {
    const limit = PLANS[currentTier].limits.artists
    if (limit === -1) return null // unlimited
    return Math.max(0, limit - currentCount)
  }

  // Get all plans for comparison
  const getAllPlans = (): PlanFeatures[] => {
    return [PLANS.free, PLANS.pro, PLANS.enterprise]
  }

  const value: SubscriptionContextType = {
    currentTier,
    currentPlan: PLANS[currentTier],
    setTier: handleSetTier,
    hasFeature,
    canAddArtist,
    getRemainingArtists,
    getAllPlans,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

// Custom hook to use subscription context
export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
