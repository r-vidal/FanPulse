import { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Crown, Sparkles } from 'lucide-react'

export interface BadgeProps {
  children?: ReactNode
  variant?: 'default' | 'pro' | 'new' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  className
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    pro: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30',
    new: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  const defaultIcons = {
    pro: <Crown className="w-3 h-3" />,
    new: <Sparkles className="w-3 h-3" />,
  }

  const displayIcon = icon || (variant === 'pro' || variant === 'new' ? defaultIcons[variant] : null)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full transition-all',
        'animate-scale-in',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {displayIcon}
      {children}
    </span>
  )
}
