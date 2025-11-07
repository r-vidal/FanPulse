'use client'

/**
 * PlanComparison Component
 *
 * Beautiful pricing comparison cards with:
 * - All 3 plans side-by-side (FREE, PRO, ENTERPRISE)
 * - Feature comparison
 * - Current plan indicator
 * - Switch plan button (for dev and production)
 * - Responsive design
 * - Dark mode support
 */

import { Check, Zap, Crown, Sparkles, ArrowRight } from 'lucide-react'
import { useSubscription, SubscriptionTier } from '@/contexts/SubscriptionContext'

interface PlanComparisonProps {
  onPlanSelect?: (tier: SubscriptionTier) => void
  showDevSwitch?: boolean // Show instant switch for dev mode
}

export default function PlanComparison({ onPlanSelect, showDevSwitch = true }: PlanComparisonProps) {
  const { currentTier, getAllPlans, setTier } = useSubscription()
  const plans = getAllPlans()

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (showDevSwitch) {
      // Dev mode: instant switch
      setTier(tier)
    }
    if (onPlanSelect) {
      onPlanSelect(tier)
    }
  }

  const getPlanIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return <Sparkles className="w-6 h-6" />
      case 'pro':
        return <Zap className="w-6 h-6" />
      case 'enterprise':
        return <Crown className="w-6 h-6" />
    }
  }

  const getPlanColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return 'blue'
      case 'pro':
        return 'purple'
      case 'enterprise':
        return 'yellow'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select the plan that fits your needs. Switch anytime.
        </p>
        {showDevSwitch && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-full">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
              Dev Mode: Click any plan to switch instantly
            </span>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentTier === plan.name
          const color = getPlanColor(plan.name as SubscriptionTier)
          const colorClasses = {
            blue: {
              bg: 'from-blue-500 to-blue-600',
              text: 'text-blue-600 dark:text-blue-400',
              border: 'border-blue-500',
              button: 'bg-blue-600 hover:bg-blue-700',
              badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
            },
            purple: {
              bg: 'from-purple-500 to-purple-600',
              text: 'text-purple-600 dark:text-purple-400',
              border: 'border-purple-500',
              button: 'bg-purple-600 hover:bg-purple-700',
              badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
            },
            yellow: {
              bg: 'from-yellow-500 to-yellow-600',
              text: 'text-yellow-600 dark:text-yellow-400',
              border: 'border-yellow-500',
              button: 'bg-yellow-600 hover:bg-yellow-700',
              badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
            },
          }[color]

          return (
            <div
              key={plan.name}
              className={`
                relative bg-white dark:bg-gray-900 rounded-xl border-2 transition-all
                ${
                  isCurrentPlan
                    ? `${colorClasses.border} shadow-lg`
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }
              `}
            >
              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`px-3 py-1 ${colorClasses.badge} rounded-full text-xs font-bold uppercase`}>
                    Current Plan
                  </span>
                </div>
              )}

              {/* Most Popular Badge for PRO */}
              {plan.name === 'pro' && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold uppercase shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses.bg} flex items-center justify-center text-white mb-4`}>
                    {getPlanIcon(plan.name as SubscriptionTier)}
                  </div>
                  <h3 className={`text-2xl font-bold ${colorClasses.text} uppercase tracking-wide`}>
                    {plan.displayName}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>
                </div>

                {/* Pricing */}
                <div>
                  {plan.price === 0 ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">Free</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          €{plan.price}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">/month</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                        or €{plan.priceAnnual}/year (save €{plan.price * 12 - plan.priceAnnual})
                      </p>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 ${colorClasses.text} flex-shrink-0 mt-0.5`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits Summary */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">Artists</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {plan.limits.artists === -1 ? 'Unlimited' : plan.limits.artists}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">Team Members</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {plan.limits.teamMembers === -1 ? 'Unlimited' : plan.limits.teamMembers}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">API Calls</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {plan.limits.apiCallsPerMonth === -1
                          ? 'Unlimited'
                          : `${(plan.limits.apiCallsPerMonth / 1000).toFixed(0)}K/mo`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">Storage</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {plan.limits.storageGB === -1 ? 'Unlimited' : `${plan.limits.storageGB}GB`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleSelectPlan(plan.name as SubscriptionTier)}
                  disabled={isCurrentPlan && !showDevSwitch}
                  className={`
                    w-full py-3 rounded-lg font-semibold text-white transition-all
                    flex items-center justify-center gap-2
                    ${
                      isCurrentPlan && !showDevSwitch
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                        : `${colorClasses.button} shadow-md hover:shadow-lg`
                    }
                  `}
                >
                  {isCurrentPlan ? (
                    showDevSwitch ? (
                      'Switch to this plan'
                    ) : (
                      'Current Plan'
                    )
                  ) : (
                    <>
                      {currentTier === 'free' ? 'Upgrade' : plan.name === 'free' ? 'Downgrade' : 'Switch'} to {plan.displayName}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Advanced Features Comparison
        </h3>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Feature
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                  FREE
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                  PRO
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  ENTERPRISE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[
                { label: 'AI-Powered Tools', key: 'aiTools' },
                { label: 'Scout Mode A&R', key: 'scoutMode' },
                { label: 'Tour Planning Intelligence', key: 'tourPlanning' },
                { label: 'Social Media ROI Tracking', key: 'socialROI' },
                { label: 'Revenue Forecasting', key: 'revenueForecasting' },
                { label: 'Release Optimizer', key: 'releaseOptimizer' },
                { label: 'API Access', key: 'apiAccess' },
                { label: 'White-Label Reports', key: 'whiteLabel' },
                { label: 'Priority Support', key: 'prioritySupport' },
                { label: 'Custom Integrations', key: 'customIntegrations' },
              ].map((feature) => (
                <tr key={feature.key}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {feature.label}
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="px-6 py-4 text-center">
                      {plan.advanced[feature.key as keyof typeof plan.advanced] ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="mt-8 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-8 text-center">
        <Crown className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Need a Custom Solution?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
          Enterprise plans include custom features, dedicated support, and flexible pricing for large organizations.
        </p>
        <button className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold shadow-md hover:shadow-lg transition-all">
          Contact Sales
        </button>
      </div>
    </div>
  )
}
