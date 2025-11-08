/**
 * Card Component
 *
 * Modern card container with glassmorphism and subtle animations
 */

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
}

export function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  return (
    <div className={`
      bg-white dark:bg-gray-900
      rounded-xl
      shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50
      border border-gray-200/50 dark:border-gray-800/50
      backdrop-blur-sm
      transition-all duration-300
      ${hover ? 'hover:shadow-xl hover:shadow-gray-300/50 dark:hover:shadow-gray-800/50 hover:-translate-y-1' : ''}
      ${gradient ? 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-800 ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}
