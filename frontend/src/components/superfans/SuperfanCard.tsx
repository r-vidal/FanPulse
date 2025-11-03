/**
 * SuperfanCard Component
 *
 * Displays a single superfan with their details and scores
 */

import { Superfan } from '@/lib/api/superfans'
import { Heart, Clock, DollarSign, TrendingUp, MapPin } from 'lucide-react'

interface SuperfanCardProps {
  superfan: Superfan
  rank: number
}

export default function SuperfanCard({ superfan, rank }: SuperfanCardProps) {
  // Determine tier color based on FVS score
  const getTierColor = (score: number) => {
    if (score >= 90) return 'text-yellow-600 bg-yellow-50 border-yellow-300'
    if (score >= 75) return 'text-purple-600 bg-purple-50 border-purple-300'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-300'
    return 'text-gray-600 bg-gray-50 border-gray-300'
  }

  const getTierLabel = (score: number) => {
    if (score >= 90) return 'Gold'
    if (score >= 75) return 'Silver'
    if (score >= 60) return 'Bronze'
    return 'Emerging'
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-500">
      <div className="flex items-start justify-between mb-4">
        {/* Rank Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
            #{rank}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Fan #{superfan.platform_user_id.slice(-8)}
            </h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getTierColor(superfan.fvs_score)}`}>
              {getTierLabel(superfan.fvs_score)} Tier
            </span>
          </div>
        </div>

        {/* FVS Score */}
        <div className="text-right">
          <div className="text-sm text-gray-500">FVS Score</div>
          <div className="text-2xl font-bold text-blue-600">
            {superfan.fvs_score.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">/ 100</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {/* Listening Hours */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Hours</span>
          </div>
          <div className="font-bold text-gray-900">
            {superfan.listening_hours.toFixed(1)}h
          </div>
        </div>

        {/* Engagement */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Heart className="w-4 h-4" />
            <span className="text-xs">Engagement</span>
          </div>
          <div className="font-bold text-gray-900">
            {superfan.engagement_score.toFixed(1)}
          </div>
        </div>

        {/* Monetization */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Value</span>
          </div>
          <div className="font-bold text-gray-900">
            {superfan.monetization_score.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Location */}
      {superfan.location && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{superfan.location}</span>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500">
        Last updated: {new Date(superfan.last_updated).toLocaleDateString()}
      </div>
    </div>
  )
}
