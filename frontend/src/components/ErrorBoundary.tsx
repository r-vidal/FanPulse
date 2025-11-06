'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Implements graceful error handling per WCAG 2.1 best practices
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // Call optional onError callback (e.g., for Sentry logging)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-lg w-full">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                We encountered an unexpected error. Please try refreshing the page or return to the dashboard.
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
                <button
                  onClick={() => (window.location.href = '/dashboard')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>

              {/* Support Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  If this problem persists, please contact{' '}
                  <a
                    href="mailto:support@fanpulse.app"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    support@fanpulse.app
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
