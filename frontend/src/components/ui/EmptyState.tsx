import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  variant?: 'default' | 'info' | 'warning' | 'success'
}

const variantStyles = {
  default: {
    container: 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800',
    icon: 'text-gray-400 dark:text-gray-600',
    title: 'text-gray-900 dark:text-white',
    description: 'text-gray-600 dark:text-gray-400',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    description: 'text-blue-700 dark:text-blue-300',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-500 dark:text-yellow-400',
    title: 'text-yellow-900 dark:text-yellow-100',
    description: 'text-yellow-700 dark:text-yellow-300',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-500 dark:text-green-400',
    title: 'text-green-900 dark:text-green-100',
    description: 'text-green-700 dark:text-green-300',
    button: 'bg-green-600 hover:bg-green-700 text-white',
  },
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={`rounded-lg border ${styles.container} p-12 text-center transition-colors`}
    >
      {Icon && (
        <Icon className={`w-16 h-16 ${styles.icon} mx-auto mb-4`} />
      )}
      <h3 className={`text-lg font-semibold ${styles.title} mb-2`}>
        {title}
      </h3>
      <p className={`${styles.description} mb-6 max-w-md mx-auto`}>
        {description}
      </p>
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className={`inline-flex items-center px-6 py-3 ${styles.button} rounded-lg font-medium transition-colors shadow-sm hover:shadow-md`}
            >
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              onClick={action.onClick}
              className={`inline-flex items-center px-6 py-3 ${styles.button} rounded-lg font-medium transition-colors shadow-sm hover:shadow-md`}
            >
              {action.label}
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}

// Specialized Empty States
export function EmptyArtists() {
  return (
    <EmptyState
      icon={require('lucide-react').Users}
      title="No Artists Yet"
      description="Get started by connecting your first artist profile to unlock powerful analytics and insights."
      action={{
        label: 'Add Your First Artist',
        href: '/dashboard/artists/add',
      }}
      variant="info"
    />
  )
}

export function EmptyActions() {
  return (
    <EmptyState
      icon={require('lucide-react').ListTodo}
      title="No Actions Available"
      description="Once you add artists and capture data, AI-powered recommendations will appear here to help grow your roster."
      variant="default"
    />
  )
}

export function EmptySuperfans() {
  return (
    <EmptyState
      icon={require('lucide-react').Heart}
      title="No Superfans Found"
      description="We haven't identified any superfans yet. This could be due to limited data or the minimum FVS threshold being too high."
      variant="default"
    />
  )
}

export function NoResults({ searchQuery }: { searchQuery?: string }) {
  return (
    <EmptyState
      icon={require('lucide-react').Search}
      title="No Results Found"
      description={
        searchQuery
          ? `We couldn't find anything matching "${searchQuery}". Try adjusting your search or filters.`
          : "No items match your current filters. Try adjusting your criteria."
      }
      variant="default"
    />
  )
}
