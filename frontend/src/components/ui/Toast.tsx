'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { Toast as ToastType, useToast } from '@/contexts/ToastContext'

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles = {
  success: 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200',
  error: 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-800 dark:text-blue-200',
  warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 text-yellow-800 dark:text-yellow-200',
}

export function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useToast()
  const Icon = icons[toast.type]

  useEffect(() => {
    // Animate in
    const element = document.getElementById(`toast-${toast.id}`)
    if (element) {
      element.classList.add('animate-slide-in')
    }
  }, [toast.id])

  // Priority-based styling
  const priorityClasses = {
    critical: 'ring-4 ring-red-500/50 dark:ring-red-400/50 shadow-2xl',
    high: 'ring-2 ring-gray-300/50 dark:ring-gray-600/50 shadow-xl',
    low: 'shadow-lg',
  }

  const priorityBorder = {
    critical: 'border-l-8',
    high: 'border-l-6',
    low: 'border-l-4',
  }

  const priority = toast.priority || 'low'

  return (
    <div
      id={`toast-${toast.id}`}
      className={`flex flex-col gap-2 p-4 rounded-lg ${priorityBorder[priority]} ${priorityClasses[priority]} ${styles[toast.type]} transform transition-all duration-300`}
      role="alert"
      aria-live={priority === 'critical' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">{toast.message}</p>
          {priority === 'critical' && (
            <p className="text-xs mt-1 opacity-80">This notification requires your attention</p>
          )}
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="flex-shrink-0 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action button if provided */}
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick()
            removeToast(toast.id)
          }}
          className="text-xs font-semibold underline hover:no-underline transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded px-1"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
